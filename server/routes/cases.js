const express = require('express');
const router = express.Router();
const Case = require('../models/Case');
const CaseNotification = require('../models/CaseNotification');
const authMiddleware = require('../middleware/auth');
const nodemailer = require('nodemailer');

// ── List all cases (for the dashboard view) ───────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
    try {
        const cases = await Case.find({}).sort({ next_hearing: 1 }).limit(50);
        res.json({ cases });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error while fetching cases.' });
    }
});

// ── Search case by CNR ────────────────────────────────────────────────────────
router.get('/:cnr', authMiddleware, async (req, res) => {
    try {
        const cnr = req.params.cnr.toUpperCase().trim();
        const caseData = await Case.findOne({ cnr_no: cnr });
        if (!caseData) {
            return res.status(404).json({ message: `No case found with CNR number: ${cnr}` });
        }
        res.json({ case: caseData });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error while fetching case.' });
    }
});

// ── Subscribe to hearing notification ────────────────────────────────────────
router.post('/:cnr/notify', authMiddleware, async (req, res) => {
    try {
        const cnr = req.params.cnr.toUpperCase().trim();
        const { notify_email, notify_phone } = req.body;

        if (!notify_email) {
            return res.status(400).json({ message: 'Email is required for notifications.' });
        }

        const caseData = await Case.findOne({ cnr_no: cnr });
        if (!caseData) return res.status(404).json({ message: 'Case not found.' });

        if (!caseData.next_hearing) {
            return res.status(400).json({ message: 'This case has no next hearing date set.' });
        }

        // Upsert — replace if same CNR + email already subscribed
        await CaseNotification.findOneAndUpdate(
            { cnr_no: cnr, notify_email },
            {
                cnr_no: cnr,
                case_title: `${caseData.petitioner} vs ${caseData.respondent}`,
                next_hearing: caseData.next_hearing,
                notify_email,
                notify_phone: notify_phone || '',
                user_id: req.user.id,
                notified: false,
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        const hearingDate = new Date(caseData.next_hearing).toLocaleDateString('en-IN', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

        res.json({
            message: `✅ You will be notified at ${notify_email} one day before the hearing on ${hearingDate}.`
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to save notification preference.' });
    }
});

// ── Daily scheduler helper (called from index.js after cron fires) ───────────
async function sendPendingHearingNotifications() {
    try {
        // Find notifications for hearings that are TOMORROW (within next 24-48 hours)
        const now = new Date();
        const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
        const dayAfter = new Date(now); dayAfter.setDate(now.getDate() + 2);

        const subs = await CaseNotification.find({
            notified: false,
            next_hearing: { $gte: tomorrow, $lt: dayAfter }
        });

        if (subs.length === 0) return;

        let transporter;
        try {
            transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
            });
        } catch {
            console.warn('⚠️  Email transport not configured — skipping hearing notifications.');
            return;
        }

        for (const sub of subs) {
            const hearingDate = new Date(sub.next_hearing).toLocaleDateString('en-IN', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });

            const html = `
                <div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
                    <div style="background:#0f172a;padding:20px 24px;">
                        <h2 style="color:#fff;margin:0;font-size:1.1rem;">⚖️ Hearing Reminder — Justexa</h2>
                    </div>
                    <div style="padding:24px;">
                        <p style="color:#374151;margin:0 0 16px;">Dear User,</p>
                        <p style="color:#374151;margin:0 0 20px;">
                            This is a reminder that the following case has a <strong>court hearing tomorrow</strong>.
                        </p>
                        <div style="background:#f8fafc;border-left:4px solid #0f172a;border-radius:6px;padding:16px 18px;margin-bottom:20px;">
                            <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
                                <tr><td style="padding:4px 0;color:#6b7280;width:40%;">Case Title</td><td style="color:#111827;font-weight:600;">${sub.case_title || sub.cnr_no}</td></tr>
                                <tr><td style="padding:4px 0;color:#6b7280;">CNR Number</td><td style="color:#111827;font-weight:600;font-family:monospace;">${sub.cnr_no}</td></tr>
                                <tr><td style="padding:4px 0;color:#6b7280;">📅 Hearing Date</td><td style="color:#111827;font-weight:700;">${hearingDate}</td></tr>
                            </table>
                        </div>
                        <p style="color:#374151;margin:0 0 8px;">Please make necessary arrangements well in advance.</p>
                        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;"/>
                        <p style="color:#9ca3af;font-size:0.76rem;margin:0;">
                            Sent by <a href="http://localhost:3000" style="color:#6b7280;">Justexa Legal Platform</a>. 
                            You subscribed to this reminder for CNR ${sub.cnr_no}.
                        </p>
                    </div>
                </div>
            `;

            try {
                await transporter.sendMail({
                    from: `"Justexa Reminders" <${process.env.EMAIL_USER}>`,
                    to: sub.notify_email,
                    subject: `⚖️ Hearing Tomorrow: ${sub.case_title || sub.cnr_no} — ${hearingDate}`,
                    html,
                });
                // Mark as notified so we don't send twice
                await CaseNotification.findByIdAndUpdate(sub._id, { notified: true });
                console.log(`✅ Hearing reminder sent to ${sub.notify_email} for ${sub.cnr_no}`);
            } catch (mailErr) {
                console.warn(`⚠️  Failed to send reminder to ${sub.notify_email}:`, mailErr.message);
            }
        }
    } catch (err) {
        console.error('Cron job error:', err);
    }
}

router.sendPendingHearingNotifications = sendPendingHearingNotifications;

// ── Seed sample cases ─────────────────────────────────────────────────────────
router.post('/seed', async (req, res) => {
    try {
        const sampleCases = [
            { cnr_no: 'TNCH010012345', status: 'Pending', petitioner: 'Ramesh Kumar', respondent: 'State of Tamil Nadu', court_name: 'Madras High Court', next_hearing: new Date('2026-03-15'), case_type: 'Criminal', filing_date: new Date('2024-01-10'), judge_name: 'Hon. Justice A.K. Krishnamurthy' },
            { cnr_no: 'DLHC020067890', status: 'Active', petitioner: 'Priya Singh', respondent: 'ABC Corporation Ltd.', court_name: 'Delhi High Court', next_hearing: new Date('2026-04-20'), case_type: 'Civil', filing_date: new Date('2023-11-05'), judge_name: 'Hon. Justice B.L. Mehta' },
            { cnr_no: 'MHCC030098765', status: 'Disposed', petitioner: 'Suresh Babu', respondent: 'Maharashtra Government', court_name: 'Bombay High Court', next_hearing: new Date('2026-02-28'), case_type: 'Writ Petition', filing_date: new Date('2022-06-15'), judge_name: 'Hon. Justice C.R. Patil' },
            { cnr_no: 'KRHC040011223', status: 'Active', petitioner: 'Meena Devi', respondent: 'Karnataka State Board', court_name: 'Karnataka High Court', next_hearing: new Date('2026-05-10'), case_type: 'Family', filing_date: new Date('2023-03-22'), judge_name: 'Hon. Justice D.S. Hegde' },
            { cnr_no: 'KLHC050033445', status: 'Pending', petitioner: 'John Mathew', respondent: 'Kerala Land Authority', court_name: 'Kerala High Court', next_hearing: new Date('2026-06-18'), case_type: 'Property', filing_date: new Date('2023-07-14'), judge_name: 'Hon. Justice E.V. Nair' },
            { cnr_no: 'TSHC060055667', status: 'Active', petitioner: 'Anita Reddy', respondent: 'Telangana Revenue Dept.', court_name: 'Telangana High Court', next_hearing: new Date('2026-03-28'), case_type: 'Revenue', filing_date: new Date('2024-02-01'), judge_name: 'Hon. Justice F.K. Rao' },
            { cnr_no: 'WBHC070077889', status: 'Pending', petitioner: 'Sanjoy Ghosh', respondent: 'State of West Bengal', court_name: 'Calcutta High Court', next_hearing: new Date('2026-07-05'), case_type: 'Criminal', filing_date: new Date('2023-09-30'), judge_name: 'Hon. Justice G.P. Banerjee' },
            { cnr_no: 'APHY080099002', status: 'Disposed', petitioner: 'Lakshmi Naidu', respondent: 'AP Electricity Board', court_name: 'AP High Court', next_hearing: new Date('2026-01-30'), case_type: 'Civil', filing_date: new Date('2021-12-20'), judge_name: 'Hon. Justice H.R. Murthy' },
            { cnr_no: 'TNCH090021134', status: 'Active', petitioner: 'Vijay Anand', respondent: 'Chennai Corporation', court_name: 'Madras High Court', next_hearing: new Date('2026-04-12'), case_type: 'Municipal', filing_date: new Date('2024-03-05'), judge_name: 'Hon. Justice I.S. Rajan' },
            { cnr_no: 'DLHC100043256', status: 'Pending', petitioner: 'Kavita Sharma', respondent: 'DDA Housing Board', court_name: 'Delhi High Court', next_hearing: new Date('2026-05-22'), case_type: 'Property', filing_date: new Date('2023-08-18'), judge_name: 'Hon. Justice J.K. Gupta' },
            { cnr_no: 'MHCC110065478', status: 'Active', petitioner: 'Rajesh Patil', respondent: 'MSRTC', court_name: 'Bombay High Court', next_hearing: new Date('2026-06-30'), case_type: 'Labour', filing_date: new Date('2022-10-25'), judge_name: 'Hon. Justice K.M. Joshi' },
            { cnr_no: 'KRHC120087690', status: 'Pending', petitioner: 'Savitha Gowda', respondent: 'BBMP Bengaluru', court_name: 'Karnataka High Court', next_hearing: new Date('2026-07-15'), case_type: 'Writ Petition', filing_date: new Date('2024-01-28'), judge_name: 'Hon. Justice L.N. Shetty' },
            { cnr_no: 'KLHC130019812', status: 'Disposed', petitioner: 'Thomas Varughese', respondent: 'Kochi Metro Rail Ltd.', court_name: 'Kerala High Court', next_hearing: new Date('2026-02-14'), case_type: 'Civil', filing_date: new Date('2021-05-17'), judge_name: 'Hon. Justice M.R. Menon' },
            { cnr_no: 'TSHC140031034', status: 'Active', petitioner: 'Padma Latha', respondent: 'TSPSC', court_name: 'Telangana High Court', next_hearing: new Date('2026-08-08'), case_type: 'Service', filing_date: new Date('2023-04-09'), judge_name: 'Hon. Justice N.K. Reddy' },
            { cnr_no: 'WBHC150053256', status: 'Pending', petitioner: 'Arnab Sen', respondent: 'Kolkata Municipal Corp.', court_name: 'Calcutta High Court', next_hearing: new Date('2026-09-02'), case_type: 'Municipal', filing_date: new Date('2024-02-22'), judge_name: 'Hon. Justice O.P. Das' },
            { cnr_no: 'APHY160075478', status: 'Active', petitioner: 'Sunita Krishnaiah', respondent: 'Andhra Pradesh Govt.', court_name: 'AP High Court', next_hearing: new Date('2026-03-20'), case_type: 'Writ Petition', filing_date: new Date('2023-06-11'), judge_name: 'Hon. Justice P.C. Venkat' },
            { cnr_no: 'TNCH170097690', status: 'Active', petitioner: 'Murugan S.', respondent: 'TNEB', court_name: 'Madras High Court', next_hearing: new Date('2026-04-25'), case_type: 'Consumer', filing_date: new Date('2022-11-03'), judge_name: 'Hon. Justice Q.R. Pandian' },
            { cnr_no: 'DLHC180019812', status: 'Pending', petitioner: 'Ritu Agarwal', respondent: 'Income Tax Dept.', court_name: 'Delhi High Court', next_hearing: new Date('2026-10-10'), case_type: 'Taxation', filing_date: new Date('2024-04-15'), judge_name: 'Hon. Justice R.S. Kapoor' },
            { cnr_no: 'MHCC190041034', status: 'Disposed', petitioner: 'Sunil Bhosale', respondent: 'ICICI Bank Ltd.', court_name: 'Bombay High Court', next_hearing: new Date('2026-01-20'), case_type: 'Banking', filing_date: new Date('2020-08-30'), judge_name: 'Hon. Justice S.T. Kulkarni' },
            { cnr_no: 'KRHC200063256', status: 'Active', petitioner: 'Deepika Rao', respondent: 'Mysuru DCCB', court_name: 'Karnataka High Court', next_hearing: new Date('2026-05-18'), case_type: 'Banking', filing_date: new Date('2023-12-07'), judge_name: 'Hon. Justice T.V. Kumar' },
            { cnr_no: 'KLHC210085478', status: 'Pending', petitioner: 'George Kuriakose', respondent: 'Kerala PWD', court_name: 'Kerala High Court', next_hearing: new Date('2026-11-05'), case_type: 'Civil', filing_date: new Date('2024-05-19'), judge_name: 'Hon. Justice U.S. Joseph' },
            { cnr_no: 'TSHC220007690', status: 'Active', petitioner: 'Ramana Chary', respondent: 'HMWSSB', court_name: 'Telangana High Court', next_hearing: new Date('2026-06-22'), case_type: 'Municipal', filing_date: new Date('2023-01-25'), judge_name: 'Hon. Justice V.K. Narayana' },
            { cnr_no: 'WBHC230029812', status: 'Pending', petitioner: 'Moulima Biswas', respondent: 'WBSEDCL', court_name: 'Calcutta High Court', next_hearing: new Date('2026-12-01'), case_type: 'Consumer', filing_date: new Date('2024-06-30'), judge_name: 'Hon. Justice W.P. Roy' },
            { cnr_no: 'APHY240051034', status: 'Active', petitioner: 'Tirumala Rao', respondent: 'AP Revenue Board', court_name: 'AP High Court', next_hearing: new Date('2026-07-14'), case_type: 'Revenue', filing_date: new Date('2022-09-12'), judge_name: 'Hon. Justice X.R. Varma' },
            { cnr_no: 'TNCH250073256', status: 'Pending', petitioner: 'Bala Murugan', respondent: 'Madurai Corporation', court_name: 'Madras High Court', next_hearing: new Date('2026-08-19'), case_type: 'Municipal', filing_date: new Date('2024-07-08'), judge_name: 'Hon. Justice Y.K. Subramanian' },
            { cnr_no: 'DLHC260095478', status: 'Active', petitioner: 'Nisha Verma', respondent: 'LIC of India', court_name: 'Delhi High Court', next_hearing: new Date('2026-09-15'), case_type: 'Insurance', filing_date: new Date('2023-10-21'), judge_name: 'Hon. Justice Z.S. Tiwari' },
            { cnr_no: 'MHCC270017690', status: 'Pending', petitioner: 'Ganesh Jadhav', respondent: 'Pune Municipal Corp.', court_name: 'Bombay High Court', next_hearing: new Date('2026-10-28'), case_type: 'Property', filing_date: new Date('2024-08-14'), judge_name: 'Hon. Justice A.B. Deshpande' },
            { cnr_no: 'KRHC280039812', status: 'Active', petitioner: 'Ratna Prabha', respondent: 'KPTCL', court_name: 'Karnataka High Court', next_hearing: new Date('2026-11-20'), case_type: 'Service', filing_date: new Date('2023-05-16'), judge_name: 'Hon. Justice B.C. Naik' },
            { cnr_no: 'KLHC290061034', status: 'Disposed', petitioner: 'Joshy Philip', respondent: 'Kerala Tourism Board', court_name: 'Kerala High Court', next_hearing: new Date('2026-03-08'), case_type: 'Civil', filing_date: new Date('2021-02-28'), judge_name: 'Hon. Justice C.D. Thomas' },
            { cnr_no: 'TSHC300083256', status: 'Active', petitioner: 'Srinivas Rao', respondent: 'Hyderabad Metro Rail', court_name: 'Telangana High Court', next_hearing: new Date('2026-12-10'), case_type: 'Writ Petition', filing_date: new Date('2024-09-01'), judge_name: 'Hon. Justice D.E. Kumar' },
            { cnr_no: 'WBHC310005478', status: 'Pending', petitioner: 'Supriya Chatterjee', respondent: 'WBPSC', court_name: 'Calcutta High Court', next_hearing: new Date('2026-04-07'), case_type: 'Service', filing_date: new Date('2023-11-29'), judge_name: 'Hon. Justice E.F. Sen' },
            { cnr_no: 'APHY320027690', status: 'Active', petitioner: 'Nageswara Rao', respondent: 'APIIC Ltd.', court_name: 'AP High Court', next_hearing: new Date('2026-05-25'), case_type: 'Corporate', filing_date: new Date('2022-04-05'), judge_name: 'Hon. Justice F.G. Raju' },
            { cnr_no: 'TNCH330049812', status: 'Pending', petitioner: 'Selvi Arumugam', respondent: 'TANGEDCO', court_name: 'Madras High Court', next_hearing: new Date('2026-06-04'), case_type: 'Consumer', filing_date: new Date('2024-10-10'), judge_name: 'Hon. Justice G.H. Natarajan' },
            { cnr_no: 'DLHC340071034', status: 'Active', petitioner: 'Rahul Malhotra', respondent: 'Customs Department', court_name: 'Delhi High Court', next_hearing: new Date('2026-07-21'), case_type: 'Customs', filing_date: new Date('2023-02-14'), judge_name: 'Hon. Justice H.I. Chopra' },
            { cnr_no: 'MHCC350093256', status: 'Pending', petitioner: 'Sunanda Phadke', respondent: 'Nashik Dev. Authority', court_name: 'Bombay High Court', next_hearing: new Date('2026-08-30'), case_type: 'Property', filing_date: new Date('2024-11-18'), judge_name: 'Hon. Justice I.J. Pawar' },
            { cnr_no: 'KRHC360015478', status: 'Active', petitioner: 'Arun Shetty', respondent: 'BDA Bengaluru', court_name: 'Karnataka High Court', next_hearing: new Date('2026-09-08'), case_type: 'Property', filing_date: new Date('2023-07-22'), judge_name: 'Hon. Justice J.K. Murthy' },
            { cnr_no: 'KLHC370037690', status: 'Pending', petitioner: 'Sindhu Nair', respondent: 'Thiruvananthapuram Corp.', court_name: 'Kerala High Court', next_hearing: new Date('2026-10-16'), case_type: 'Municipal', filing_date: new Date('2024-12-04'), judge_name: 'Hon. Justice K.L. Pillai' },
            { cnr_no: 'TSHC380059812', status: 'Active', petitioner: 'Venkataramana', respondent: 'TS Genco', court_name: 'Telangana High Court', next_hearing: new Date('2026-11-25'), case_type: 'Labour', filing_date: new Date('2022-06-29'), judge_name: 'Hon. Justice L.M. Reddy' },
            { cnr_no: 'WBHC390081034', status: 'Disposed', petitioner: 'Debjit Mukherjee', respondent: 'WBHIDC', court_name: 'Calcutta High Court', next_hearing: new Date('2026-01-14'), case_type: 'Corporate', filing_date: new Date('2020-03-18'), judge_name: 'Hon. Justice M.N. Bose' },
            { cnr_no: 'APHY400003256', status: 'Active', petitioner: 'Padmavathi K.', respondent: 'AP TRANSCO', court_name: 'AP High Court', next_hearing: new Date('2026-12-20'), case_type: 'Service', filing_date: new Date('2023-08-30'), judge_name: 'Hon. Justice N.O. Prasad' },
            { cnr_no: 'TNCH410025478', status: 'Pending', petitioner: 'Karthikeyan S.', respondent: 'Coimbatore Corp.', court_name: 'Madras High Court', next_hearing: new Date('2026-04-18'), case_type: 'Municipal', filing_date: new Date('2025-01-07'), judge_name: 'Hon. Justice O.P. Subramaniam' },
            { cnr_no: 'DLHC420047690', status: 'Active', petitioner: 'Asha Mathur', respondent: 'EPFO', court_name: 'Delhi High Court', next_hearing: new Date('2026-05-30'), case_type: 'Labour', filing_date: new Date('2023-03-19'), judge_name: 'Hon. Justice P.Q. Sharma' },
            { cnr_no: 'MHCC430069812', status: 'Pending', petitioner: 'Jitendra Sonawane', respondent: 'SBI Home Loans', court_name: 'Bombay High Court', next_hearing: new Date('2026-06-12'), case_type: 'Banking', filing_date: new Date('2025-02-15'), judge_name: 'Hon. Justice Q.R. Desai' },
            { cnr_no: 'KRHC440091034', status: 'Active', petitioner: 'Chandrika Bai', respondent: 'UB Holdings', court_name: 'Karnataka High Court', next_hearing: new Date('2026-07-28'), case_type: 'Corporate', filing_date: new Date('2022-12-08'), judge_name: 'Hon. Justice R.S. Swamy' },
            { cnr_no: 'KLHC450013256', status: 'Pending', petitioner: 'Francis Xavier', respondent: 'Cochin Shipyard Ltd.', court_name: 'Kerala High Court', next_hearing: new Date('2026-08-14'), case_type: 'Labour', filing_date: new Date('2025-03-22'), judge_name: 'Hon. Justice S.T. Abraham' },
            { cnr_no: 'TSHC460035478', status: 'Active', petitioner: 'Uma Shankar', respondent: 'TSIIC', court_name: 'Telangana High Court', next_hearing: new Date('2026-09-19'), case_type: 'Industrial', filing_date: new Date('2023-09-14'), judge_name: 'Hon. Justice T.U. Reddy' },
            { cnr_no: 'WBHC470057690', status: 'Pending', petitioner: 'Paramita Roy', respondent: 'WBSSC', court_name: 'Calcutta High Court', next_hearing: new Date('2026-10-22'), case_type: 'Service', filing_date: new Date('2025-04-30'), judge_name: 'Hon. Justice U.V. Datta' },
            { cnr_no: 'APHY480079812', status: 'Active', petitioner: 'Harikrishna Reddy', respondent: 'AP Housing Board', court_name: 'AP High Court', next_hearing: new Date('2026-11-14'), case_type: 'Property', filing_date: new Date('2022-07-16'), judge_name: 'Hon. Justice V.W. Rao' },
            { cnr_no: 'TNCH490001034', status: 'Pending', petitioner: 'Nalini Kumari', respondent: 'CMRL Chennai', court_name: 'Madras High Court', next_hearing: new Date('2026-12-28'), case_type: 'Civil', filing_date: new Date('2025-05-12'), judge_name: 'Hon. Justice W.X. Raman' },
            { cnr_no: 'DLHC500023256', status: 'Active', petitioner: 'Vikram Bhatia', respondent: 'NDMC', court_name: 'Delhi High Court', next_hearing: new Date('2026-03-31'), case_type: 'Writ Petition', filing_date: new Date('2023-10-05'), judge_name: 'Hon. Justice X.Y. Prasad' },
        ];

        const ops = sampleCases.map(c => ({
            updateOne: {
                filter: { cnr_no: c.cnr_no },
                update: { $set: c },
                upsert: true
            }
        }));
        const result = await Case.bulkWrite(ops);
        res.json({ message: 'Cases seeded successfully.', upserted: result.upsertedCount, modified: result.modifiedCount, total: sampleCases.length });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error seeding cases.' });
    }
});


module.exports = router;
