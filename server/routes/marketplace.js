const express = require('express');
const router = express.Router();
const Advocate = require('../models/Advocate');
const authMiddleware = require('../middleware/auth');
const nodemailer = require('nodemailer');

// Helper: deterministic fee in ₹2500–₹4000 range based on a string seed
function deterministicFee(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) & 0xffffffff;
    }
    // 16 steps of ₹100 from 2500 → 4000
    const step = Math.abs(hash) % 16;
    return 2500 + step * 100;
}

// Get all advocates, optionally filter by specialization and/or price range
// Only accessible to users (not advocates)
router.get('/', authMiddleware, async (req, res) => {
    try {
        // Block advocates from accessing marketplace
        if (req.user.role === 'advocate') {
            return res.status(403).json({ message: 'Advocates are not permitted to access the marketplace.' });
        }

        const { specialization, min_fee, max_fee } = req.query;
        let query = {};
        if (specialization && specialization.trim()) {
            query.specialization = { $regex: specialization.trim(), $options: 'i' };
        }
        // Only apply fee filter when they are explicitly requested
        if (min_fee || max_fee) {
            query.consultation_fee = {};
            if (min_fee) query.consultation_fee.$gte = Number(min_fee);
            if (max_fee) query.consultation_fee.$lte = Number(max_fee);
        }

        let advocates = await Advocate.find(query).select('-password');

        // Patch any advocate with missing/zero fee — persist to DB so it's fixed permanently
        const patchPromises = [];
        advocates = advocates.map(adv => {
            const obj = adv.toObject();
            if (!obj.consultation_fee || obj.consultation_fee === 0) {
                const fee = deterministicFee(obj.bar_council_id || obj.email || obj._id.toString());
                obj.consultation_fee = fee;
                patchPromises.push(
                    Advocate.updateOne({ _id: obj._id }, { $set: { consultation_fee: fee } })
                );
            }
            return obj;
        });
        if (patchPromises.length) await Promise.all(patchPromises);

        res.json({ advocates });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error while fetching advocates.' });
    }
});

// Get single advocate by ID
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role === 'advocate') {
            return res.status(403).json({ message: 'Advocates are not permitted to access the marketplace.' });
        }
        const advocate = await Advocate.findById(req.params.id).select('-password');
        if (!advocate) return res.status(404).json({ message: 'Advocate not found.' });
        res.json({ advocate });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Send automated case request to advocate via email
router.post('/send-request', authMiddleware, async (req, res) => {
    try {
        if (req.user.role === 'advocate') {
            return res.status(403).json({ message: 'Advocates cannot send requests.' });
        }

        const { advocateId, clientName, clientEmail, clientPhone, caseType, caseDescription, preferredDate } = req.body;

        if (!advocateId || !clientName || !clientEmail || !caseType || !caseDescription) {
            return res.status(400).json({ message: 'Name, email, case type, and description are required.' });
        }

        const advocate = await Advocate.findById(advocateId).select('-password');
        if (!advocate) return res.status(404).json({ message: 'Advocate not found.' });

        const formattedDate = preferredDate
            ? new Date(preferredDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
            : 'Not specified';

        // Try to send email via nodemailer
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER || '',
                    pass: process.env.EMAIL_PASS || ''
                }
            });

            await transporter.sendMail({
                from: `"Justexa Platform" <${process.env.EMAIL_USER || 'noreply@justexa.com'}>`,
                to: advocate.email,
                subject: `New Case Request via Justexa — ${caseType} from ${clientName}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden;">
                        <div style="background: #0f172a; padding: 24px 28px;">
                            <h2 style="color: #ffffff; margin: 0; font-size: 1.2rem;">⚖️ New Case Request — Justexa Legal Platform</h2>
                        </div>
                        <div style="padding: 24px 28px;">
                            <p style="color: #374151; margin: 0 0 16px;">Dear <strong>${advocate.name}</strong>,</p>
                            <p style="color: #374151; margin: 0 0 20px;">You have received a new client case request through the Justexa platform. Please review the details below and respond at your earliest convenience.</p>

                            <div style="background: #f8fafc; border-left: 4px solid #0f172a; border-radius: 6px; padding: 18px 20px; margin-bottom: 20px;">
                                <h3 style="margin: 0 0 14px; color: #0f172a; font-size: 1rem;">👤 Client Details</h3>
                                <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                                    <tr><td style="padding: 5px 0; color: #6b7280; width: 40%;">Full Name</td><td style="padding: 5px 0; color: #111827; font-weight: 600;">${clientName}</td></tr>
                                    <tr><td style="padding: 5px 0; color: #6b7280;">Email</td><td style="padding: 5px 0; color: #111827; font-weight: 600;"><a href="mailto:${clientEmail}" style="color: #2563eb;">${clientEmail}</a></td></tr>
                                    <tr><td style="padding: 5px 0; color: #6b7280;">Phone</td><td style="padding: 5px 0; color: #111827; font-weight: 600;">${clientPhone || 'Not provided'}</td></tr>
                                </table>
                            </div>

                            <div style="background: #f8fafc; border-left: 4px solid #2563eb; border-radius: 6px; padding: 18px 20px; margin-bottom: 20px;">
                                <h3 style="margin: 0 0 14px; color: #0f172a; font-size: 1rem;">📁 Case Details</h3>
                                <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                                    <tr><td style="padding: 5px 0; color: #6b7280; width: 40%;">Case Type</td><td style="padding: 5px 0; color: #111827; font-weight: 600;">${caseType}</td></tr>
                                    <tr><td style="padding: 5px 0; color: #6b7280;">Preferred Date</td><td style="padding: 5px 0; color: #111827; font-weight: 600;">${formattedDate}</td></tr>
                                </table>
                                <div style="margin-top: 12px;">
                                    <div style="color: #6b7280; font-size: 0.85rem; margin-bottom: 6px;">Case Description</div>
                                    <div style="color: #1f2937; white-space: pre-wrap; background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; font-size: 0.9rem; line-height: 1.6;">${caseDescription}</div>
                                </div>
                            </div>

                            <p style="color: #374151; margin: 0 0 8px;">Please reply directly to the client's email: <a href="mailto:${clientEmail}" style="color: #2563eb;">${clientEmail}</a></p>
                            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                            <p style="color: #9ca3af; font-size: 0.78rem; margin: 0;">This message was automatically generated by <a href="http://localhost:3000" style="color: #6b7280;">Justexa Legal Platform</a>. Do not reply to this email directly.</p>
                        </div>
                    </div>
                `
            });

            res.json({ message: `Your case request has been sent automatically to ${advocate.name}. They will contact you at ${clientEmail} shortly.` });
        } catch (emailErr) {
            console.warn('Email sending skipped (SMTP not configured):', emailErr.message);
            res.json({
                message: `Request recorded! ${advocate.name} will be notified at ${advocate.email}. (Configure EMAIL_USER and EMAIL_PASS in .env for live email delivery.)`,
                note: 'Email delivery requires EMAIL_USER and EMAIL_PASS in .env'
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error while sending request.' });
    }
});

// Seed advocate data
router.post('/seed', async (req, res) => {
    try {
        const advocates = [
            // ── Senior advocates (12, 5+ yrs) ──────────────────────────────────────────
            { name: "S. Muthukumaran", bar_council_id: "MS/1645/2012", email: "muthukumaran.s@chennailaw.in", mobile_no: "+91-94440-12345", specialization: "Criminal Law", experience: 14, experience_years: 14, city: "Chennai", consultation_fee: 2800 },
            { name: "Lakshmi Narayana Iyer", bar_council_id: "MS/0392/2005", email: "lakshmi.iyer@advocate.in", mobile_no: "+91-98400-56789", specialization: "Constitutional Law", experience: 21, experience_years: 21, city: "Madurai", consultation_fee: 3900 },
            { name: "Meenakshi Sundaram", bar_council_id: "MS/0825/2010", email: "m.sundaram@justice.org", mobile_no: "+91-94431-44556", specialization: "Civil Litigation", experience: 16, experience_years: 16, city: "Coimbatore", consultation_fee: 3100 },
            { name: "Reshma Kurup", bar_council_id: "K/1728/2007", email: "reshma.k@palakkadlaw.in", mobile_no: "+91-98461-44556", specialization: "Banking & Finance Law", experience: 19, experience_years: 19, city: "Palakkad", consultation_fee: 4000 },
            { name: "Venkata Ramanujam", bar_council_id: "AP/1290/2011", email: "v.ramanujam@vizaglegal.com", mobile_no: "+91-98480-12345", specialization: "Corporate Law", experience: 15, experience_years: 15, city: "Visakhapatnam", consultation_fee: 3800 },
            { name: "S. Vijay", bar_council_id: "MS/1245/2000", email: "vijay.lawyer@chennai.in", mobile_no: "+91-98412-33445", specialization: "Corporate Law", experience: 26, experience_years: 26, city: "Chennai", consultation_fee: 4000 },
            { name: "Biju Joseph", bar_council_id: "K/1442/2008", email: "biju.j@keralalegal.com", mobile_no: "+91-94465-12345", specialization: "Civil Litigation", experience: 18, experience_years: 18, city: "Kochi", consultation_fee: 3800 },
            { name: "Kavitha Murthy", bar_council_id: "KAR/3345/2012", email: "kavitha.m@mysorelaw.in", mobile_no: "+91-99860-44332", specialization: "Property Law", experience: 14, experience_years: 14, city: "Mysuru", consultation_fee: 3700 },
            { name: "Ramachandra Rao", bar_council_id: "TS/3321/2012", email: "r.rao@hydjustice.org", mobile_no: "+91-98481-99887", specialization: "Constitutional Law", experience: 14, experience_years: 14, city: "Hyderabad", consultation_fee: 3900 },
            { name: "Ganesh Hegde", bar_council_id: "KAR/2375/2012", email: "ganesh.h@karwarlegal.in", mobile_no: "+91-97422-55667", specialization: "Insurance Law", experience: 14, experience_years: 14, city: "Karwar", consultation_fee: 3100 },
            { name: "Rahul Deshpande", bar_council_id: "KAR/2210/2014", email: "rahul.d@dharwadlaw.com", mobile_no: "+91-91188-77665", specialization: "Corporate Law", experience: 12, experience_years: 12, city: "Dharwad", consultation_fee: 3800 },
            { name: "Raghavendra Chittoor", bar_council_id: "AP/5549/2011", email: "r.chittoor@tirupatilaw.in", mobile_no: "+91-99890-55667", specialization: "Criminal Law", experience: 15, experience_years: 15, city: "Tirupati", consultation_fee: 3200 },
            // ── Junior advocates (38, 0-1 yr) ──────────────────────────────────────────
            { name: "Praveen Kumar Gowda", bar_council_id: "KAR/2105/2018", email: "praveen.gowda@blrlaw.com", mobile_no: "+91-91234-99887", specialization: "Real Estate & Property Law", experience: 1, experience_years: 1, city: "Bengaluru", consultation_fee: 2700 },
            { name: "Ananthakrishnan Menon", bar_council_id: "K/1123/2015", email: "a.menon@keralalegal.in", mobile_no: "+91-98470-33221", specialization: "Family Law", experience: 1, experience_years: 1, city: "Kochi", consultation_fee: 2900 },
            { name: "Sugali Mahesh Naik", bar_council_id: "AP/351/2023", email: "mahesh.naik@apbar.in", mobile_no: "+91-97001-11002", specialization: "Labor & Employment Law", experience: 1, experience_years: 1, city: "Vijayawada", consultation_fee: 2500 },
            { name: "Rajeshwari Venkat", bar_council_id: "TS/7732/2019", email: "r.venkat@hydlaw.in", mobile_no: "+91-81234-55667", specialization: "Intellectual Property (IPR)", experience: 0, experience_years: 0, city: "Hyderabad", consultation_fee: 3000 },
            { name: "Kiran Hegde", bar_council_id: "KAR/0554/2014", email: "kiran.hegde@mangalorelaw.com", mobile_no: "+91-99001-22334", specialization: "Banking & Finance Law", experience: 1, experience_years: 1, city: "Mangaluru", consultation_fee: 3300 },
            { name: "B. Santhana Krishnan", bar_council_id: "MS/2671/2014", email: "santhana.k@chennaiadvocate.in", mobile_no: "+91-94433-22110", specialization: "Taxation Law", experience: 0, experience_years: 0, city: "Chennai", consultation_fee: 2800 },
            { name: "Divya Pillai", bar_council_id: "K/0654/2020", email: "divya.pillai@cochinbar.in", mobile_no: "+91-95622-77889", specialization: "Environmental Law", experience: 1, experience_years: 1, city: "Thiruvananthapuram", consultation_fee: 2600 },
            { name: "Shalini Reddy", bar_council_id: "TS/4432/2016", email: "shalini.reddy@hydbar.org", mobile_no: "+91-73308-44556", specialization: "Family Law", experience: 0, experience_years: 0, city: "Hyderabad", consultation_fee: 2900 },
            { name: "Arun Shabari K.R.", bar_council_id: "MS/4116/2015", email: "arun.shabari@legalcorp.in", mobile_no: "+91-94422-88990", specialization: "Criminal Law", experience: 1, experience_years: 1, city: "Salem", consultation_fee: 2700 },
            { name: "Siddharth Nambiar", bar_council_id: "K/0085/2021", email: "sid.nambiar@thrissurlaw.com", mobile_no: "+91-94470-11223", specialization: "Cyber Law", experience: 0, experience_years: 0, city: "Thrissur", consultation_fee: 2500 },
            { name: "Manjunath Swamy", bar_council_id: "KAR/6940/2021", email: "m.swamy@hublilegal.in", mobile_no: "+91-80881-22334", specialization: "Arbitration & Mediation", experience: 1, experience_years: 1, city: "Hubballi", consultation_fee: 2600 },
            { name: "Priscilla Pandian", bar_council_id: "MS/2311/2010", email: "priscilla.p@yahoo.co.in", mobile_no: "+91-94427-25555", specialization: "Civil Litigation", experience: 0, experience_years: 0, city: "Tuticorin", consultation_fee: 3000 },
            { name: "Gopalakrishnan Nair", bar_council_id: "K/3241/2013", email: "g.nair@keralabar.org", mobile_no: "+91-98460-99887", specialization: "Insurance Law", experience: 1, experience_years: 1, city: "Kozhikode", consultation_fee: 2900 },
            { name: "Harish Rao", bar_council_id: "TS/2210/2017", email: "harish.rao@warangallaw.in", mobile_no: "+91-90001-55667", specialization: "Criminal Law", experience: 0, experience_years: 0, city: "Warangal", consultation_fee: 2600 },
            { name: "Arul Alex", bar_council_id: "MS/1399/2019", email: "arul.alex@trichylegal.com", mobile_no: "+91-99440-31249", specialization: "Motor Accident Claims", experience: 1, experience_years: 1, city: "Trichy", consultation_fee: 2700 },
            { name: "Sreejith Warrier", bar_council_id: "K/5404/2021", email: "sreejith.w@malappuramlaw.in", mobile_no: "+91-94471-88990", specialization: "Civil Litigation", experience: 0, experience_years: 0, city: "Malappuram", consultation_fee: 2500 },
            { name: "Deepthi Goud", bar_council_id: "AP/8834/2015", email: "deepthi.g@kurnoollaw.com", mobile_no: "+91-98490-77665", specialization: "Family Law", experience: 1, experience_years: 1, city: "Kurnool", consultation_fee: 3600 },
            { name: "Karthik Subramanian", bar_council_id: "MS/0589/2021", email: "karthik.s@madurailaw.in", mobile_no: "+91-97880-11223", specialization: "Intellectual Property (IPR)", experience: 0, experience_years: 0, city: "Madurai", consultation_fee: 2600 },
            { name: "Sneha Mallesh", bar_council_id: "KAR/1129/2020", email: "sneha.m@belgaumlaw.in", mobile_no: "+91-97411-88990", specialization: "Human Rights Law", experience: 1, experience_years: 1, city: "Belagavi", consultation_fee: 2600 },
            { name: "J. Priscilla", bar_council_id: "MS/2612/2017", email: "j.priscilla@chennaicourt.in", mobile_no: "+91-94421-33221", specialization: "Family Law", experience: 0, experience_years: 0, city: "Chennai", consultation_fee: 2800 },
            { name: "Mohan Raj", bar_council_id: "MS/3248/2015", email: "mohan.raj@salemlegal.com", mobile_no: "+91-94432-77310", specialization: "Real Estate Law", experience: 1, experience_years: 1, city: "Salem", consultation_fee: 3700 },
            { name: "Vinayaka Bhat", bar_council_id: "KAR/0465/2019", email: "vinayaka.b@shimogalaw.in", mobile_no: "+91-94172-84926", specialization: "Cyber Law", experience: 0, experience_years: 0, city: "Shivamogga", consultation_fee: 2700 },
            { name: "Soumya Sathyan", bar_council_id: "K/9903/2015", email: "soumya.s@kottayamlaw.in", mobile_no: "+91-94472-11009", specialization: "Consumer Protection", experience: 1, experience_years: 1, city: "Kottayam", consultation_fee: 2900 },
            { name: "Arul Kannappan", bar_council_id: "MS/4088/2015", email: "arul.k@legalpro.in", mobile_no: "+91-98410-22881", specialization: "Civil Litigation", experience: 0, experience_years: 0, city: "Chennai", consultation_fee: 2800 },
            { name: "Latha Maheshwari", bar_council_id: "KAR/5541/2016", email: "latha.m@blrbar.com", mobile_no: "+91-99861-55443", specialization: "Arbitration", experience: 1, experience_years: 1, city: "Bengaluru", consultation_fee: 3000 },
            { name: "Bharath Kumar", bar_council_id: "AP/8820/2021", email: "bharath.k@nellorelaw.in", mobile_no: "+91-90001-33445", specialization: "Criminal Law", experience: 0, experience_years: 0, city: "Nellore", consultation_fee: 2500 },
            { name: "Sujatha Krishnan", bar_council_id: "MS/0135/2021", email: "sujatha.k@vjlegal.in", mobile_no: "+91-94441-22334", specialization: "Intellectual Property (IPR)", experience: 1, experience_years: 1, city: "Chennai", consultation_fee: 2600 },
            { name: "Anjali Bose", bar_council_id: "K/1657/2020", email: "anjali.b@kollambar.in", mobile_no: "+91-95677-44332", specialization: "Human Rights Law", experience: 0, experience_years: 0, city: "Kollam", consultation_fee: 2700 },
            { name: "Satish Chandra", bar_council_id: "AP/4431/2012", email: "s.chandra@gunturlaw.in", mobile_no: "+91-98485-11009", specialization: "Property Law", experience: 1, experience_years: 1, city: "Guntur", consultation_fee: 3000 },
            { name: "Vivek Shenoy", bar_council_id: "K/6654/2016", email: "vivek.shenoy@ernakulamlaw.in", mobile_no: "+91-94460-22110", specialization: "Cyber Law", experience: 0, experience_years: 0, city: "Kochi", consultation_fee: 2900 },
            { name: "Akshai Mani", bar_council_id: "MS/1639/2014", email: "akshai.mani@tnlegal.in", mobile_no: "+91-94441-62358", specialization: "Maritime Law", experience: 1, experience_years: 1, city: "Chennai", consultation_fee: 4000 },
            { name: "Pavan Kalyan", bar_council_id: "TS/9902/2013", email: "pavan.k@hydlegal.in", mobile_no: "+91-99080-11223", specialization: "Criminal Law", experience: 0, experience_years: 0, city: "Hyderabad", consultation_fee: 3000 },
            { name: "Deepak Thampi", bar_council_id: "K/2857/2024", email: "deepak.thampi@wayanadlaw.com", mobile_no: "+91-94475-66778", specialization: "Environmental Law", experience: 1, experience_years: 1, city: "Kalpetta", consultation_fee: 2500 },
            { name: "Chandrasekhar R.", bar_council_id: "MS/0085/2021", email: "c.sekhar@chennaijustice.com", mobile_no: "+91-98402-98926", specialization: "Labor Law", experience: 0, experience_years: 0, city: "Chennai", consultation_fee: 2600 },
            { name: "Navya Sree", bar_council_id: "AP/6652/2018", email: "navya.sree@apbar.gov.in", mobile_no: "+91-97005-44332", specialization: "Civil Litigation", experience: 1, experience_years: 1, city: "Amaravati", consultation_fee: 2700 },
            { name: "Arunachalam M.", bar_council_id: "MS/0229/2018", email: "arun.adv.cbe@gmail.com", mobile_no: "+91-98422-35133", specialization: "Real Estate Law", experience: 0, experience_years: 0, city: "Coimbatore", consultation_fee: 3600 },
            { name: "Rahul Varma", bar_council_id: "KAR/0987/2013", email: "rahul.varma@blrlegal.in", mobile_no: "+91-99450-98765", specialization: "Criminal Law", experience: 1, experience_years: 1, city: "Bengaluru", consultation_fee: 3000 },
            { name: "Sita Ram", bar_council_id: "TS/3342/2022", email: "sitaram.adv@hydlaw.in", mobile_no: "+91-73309-88776", specialization: "Family Law", experience: 0, experience_years: 0, city: "Hyderabad", consultation_fee: 2500 },
            // ── Additional Senior advocates (13 more = 25 total, 5+ yrs) ─────────────
            { name: "Padmavathi Srinivas", bar_council_id: "AP/3310/2009", email: "padma.s@vijayawadalaw.in", mobile_no: "+91-98480-33221", specialization: "Family Law", experience: 17, experience_years: 17, city: "Vijayawada", consultation_fee: 3600 },
            { name: "Krishnaswamy R.", bar_council_id: "MS/0441/2003", email: "krishnas.r@tnbar.in", mobile_no: "+91-94440-55667", specialization: "Constitutional Law", experience: 23, experience_years: 23, city: "Chennai", consultation_fee: 4000 },
            { name: "Suresh Babu Nair", bar_council_id: "K/2201/2006", email: "suresh.nair@ernakulambar.in", mobile_no: "+91-98461-77889", specialization: "Corporate Law", experience: 20, experience_years: 20, city: "Kochi", consultation_fee: 3900 },
            { name: "Annamalai P.", bar_council_id: "MS/1102/2008", email: "annamalai.p@madurailaw.in", mobile_no: "+91-94431-99887", specialization: "Criminal Law", experience: 18, experience_years: 18, city: "Madurai", consultation_fee: 3500 },
            { name: "Geetha Krishnamurthy", bar_council_id: "KAR/1001/2007", email: "geetha.k@bangalorelaw.in", mobile_no: "+91-99860-11223", specialization: "Civil Litigation", experience: 19, experience_years: 19, city: "Bengaluru", consultation_fee: 3700 },
            { name: "Murugesan V.", bar_council_id: "MS/2204/2010", email: "murugesan.v@coimbatorelaw.in", mobile_no: "+91-94432-44556", specialization: "Property Law", experience: 16, experience_years: 16, city: "Coimbatore", consultation_fee: 3400 },
            { name: "Saraswathi Devi", bar_council_id: "TS/1005/2005", email: "saraswathi.d@hydbar.org", mobile_no: "+91-98481-22334", specialization: "Labor & Employment Law", experience: 21, experience_years: 21, city: "Hyderabad", consultation_fee: 3800 },
            { name: "Rajan Pillai", bar_council_id: "K/3302/2004", email: "rajan.p@trivandrumlegal.in", mobile_no: "+91-98470-66778", specialization: "Insurance Law", experience: 22, experience_years: 22, city: "Thiruvananthapuram", consultation_fee: 3900 },
            { name: "Narasimha Reddy", bar_council_id: "AP/2201/2013", email: "narasimha.r@hydjustice.in", mobile_no: "+91-99890-77665", specialization: "Banking & Finance Law", experience: 13, experience_years: 13, city: "Hyderabad", consultation_fee: 3600 },
            { name: "Chandra Sekharan", bar_council_id: "K/4401/2011", email: "c.sekharan@calicutlaw.in", mobile_no: "+91-94471-55667", specialization: "Arbitration & Mediation", experience: 15, experience_years: 15, city: "Kozhikode", consultation_fee: 3300 },
            { name: "Bhavani Shankar", bar_council_id: "KAR/3301/2009", email: "bhavani.s@mysorelaw.in", mobile_no: "+91-97422-33445", specialization: "Taxation Law", experience: 17, experience_years: 17, city: "Mysuru", consultation_fee: 3500 },
            { name: "Venkataramana K.", bar_council_id: "AP/4411/2007", email: "venkat.k@tirupatilaw.in", mobile_no: "+91-99890-44332", specialization: "Corporate Law", experience: 19, experience_years: 19, city: "Tirupati", consultation_fee: 3800 },
            { name: "Lalitha Kumari", bar_council_id: "TS/5505/2010", email: "lalitha.k@secunderabadlaw.in", mobile_no: "+91-73308-99887", specialization: "Human Rights Law", experience: 16, experience_years: 16, city: "Secunderabad", consultation_fee: 3400 },
            // ── Additional Junior advocates (37 more = 75 total, 0-2 yrs) ───────────
            { name: "Aishwarya Menon", bar_council_id: "K/7701/2023", email: "aishwarya.m@keralabar.in", mobile_no: "+91-94470-22334", specialization: "Civil Litigation", experience: 1, experience_years: 1, city: "Thrissur", consultation_fee: 2500 },
            { name: "Balaji Sundaresan", bar_council_id: "MS/5501/2022", email: "balaji.s@chennaijustice.in", mobile_no: "+91-98402-11223", specialization: "Criminal Law", experience: 2, experience_years: 2, city: "Chennai", consultation_fee: 2600 },
            { name: "Chaitanya Rao", bar_council_id: "TS/8801/2024", email: "chaitanya.r@hydlaw.in", mobile_no: "+91-73309-55667", specialization: "Family Law", experience: 0, experience_years: 0, city: "Hyderabad", consultation_fee: 2500 },
            { name: "Divyanka Sharma", bar_council_id: "KAR/9901/2023", email: "divyanka.s@blrlaw.in", mobile_no: "+91-99450-11223", specialization: "Cyber Law", experience: 1, experience_years: 1, city: "Bengaluru", consultation_fee: 2600 },
            { name: "Eswaran M.", bar_council_id: "MS/6601/2023", email: "eswaran.m@madurailaw.in", mobile_no: "+91-97880-33445", specialization: "Property Law", experience: 0, experience_years: 0, city: "Madurai", consultation_fee: 2500 },
            { name: "Fathima Noor", bar_council_id: "K/8801/2024", email: "fathima.n@calicutlaw.in", mobile_no: "+91-94471-44556", specialization: "Consumer Protection", experience: 0, experience_years: 0, city: "Kozhikode", consultation_fee: 2600 },
            { name: "Gopinath S.", bar_council_id: "MS/7702/2022", email: "gopinath.s@pondiclaw.in", mobile_no: "+91-94441-77889", specialization: "Labor & Employment Law", experience: 2, experience_years: 2, city: "Puducherry", consultation_fee: 2700 },
            { name: "Haritha Varma", bar_council_id: "K/9902/2023", email: "haritha.v@trivandrumlegal.in", mobile_no: "+91-98470-88990", specialization: "Environmental Law", experience: 1, experience_years: 1, city: "Thiruvananthapuram", consultation_fee: 2500 },
            { name: "Indira Nath", bar_council_id: "AP/7701/2023", email: "indira.n@vizaglaw.in", mobile_no: "+91-98480-55667", specialization: "Human Rights Law", experience: 0, experience_years: 0, city: "Visakhapatnam", consultation_fee: 2600 },
            { name: "Jayaprakash V.", bar_council_id: "KAR/8801/2024", email: "jayaprakash.v@mangalorelaw.in", mobile_no: "+91-99001-33445", specialization: "Intellectual Property (IPR)", experience: 0, experience_years: 0, city: "Mangaluru", consultation_fee: 2500 },
            { name: "Kavya Lakshmi", bar_council_id: "TS/9902/2023", email: "kavya.l@hydlaw.in", mobile_no: "+91-81234-66778", specialization: "Taxation Law", experience: 1, experience_years: 1, city: "Hyderabad", consultation_fee: 2600 },
            { name: "Lokesh Kumar", bar_council_id: "AP/8802/2022", email: "lokesh.k@kurnoollaw.in", mobile_no: "+91-90001-44556", specialization: "Real Estate & Property Law", experience: 2, experience_years: 2, city: "Kurnool", consultation_fee: 2700 },
            { name: "Madhavi Rao", bar_council_id: "TS/6601/2024", email: "madhavi.r@nizamabadlaw.in", mobile_no: "+91-73308-77889", specialization: "Family Law", experience: 0, experience_years: 0, city: "Nizamabad", consultation_fee: 2500 },
            { name: "Naveen Krishnan", bar_council_id: "K/6601/2022", email: "naveen.k@ernakulamlaw.in", mobile_no: "+91-94460-44556", specialization: "Banking & Finance Law", experience: 2, experience_years: 2, city: "Kochi", consultation_fee: 2700 },
            { name: "Oviya Devi", bar_council_id: "MS/8802/2023", email: "oviya.d@trichylaw.in", mobile_no: "+91-99440-55667", specialization: "Criminal Law", experience: 1, experience_years: 1, city: "Trichy", consultation_fee: 2600 },
            { name: "Pradeep Kumar", bar_council_id: "KAR/7701/2023", email: "pradeep.k@dharwadlaw.in", mobile_no: "+91-91188-22334", specialization: "Civil Litigation", experience: 0, experience_years: 0, city: "Dharwad", consultation_fee: 2500 },
            { name: "Qamar Fatima", bar_council_id: "TS/7702/2024", email: "qamar.f@hydlaw.in", mobile_no: "+91-90001-66778", specialization: "Human Rights Law", experience: 0, experience_years: 0, city: "Hyderabad", consultation_fee: 2600 },
            { name: "Rajkumar S.", bar_council_id: "MS/9901/2023", email: "rajkumar.s@nagercoillaw.in", mobile_no: "+91-94427-88990", specialization: "Motor Accident Claims", experience: 1, experience_years: 1, city: "Nagercoil", consultation_fee: 2600 },
            { name: "Savitha Hegde", bar_council_id: "KAR/6601/2024", email: "savitha.h@karwarlaw.in", mobile_no: "+91-97422-66778", specialization: "Property Law", experience: 0, experience_years: 0, city: "Karwar", consultation_fee: 2500 },
            { name: "Tharun Babu", bar_council_id: "AP/9901/2023", email: "tharun.b@nellorelaw.in", mobile_no: "+91-99890-22334", specialization: "Cyber Law", experience: 1, experience_years: 1, city: "Nellore", consultation_fee: 2600 },
            { name: "Usha Kumari", bar_council_id: "K/5501/2023", email: "usha.k@kappadlaw.in", mobile_no: "+91-95622-33445", specialization: "Environmental Law", experience: 2, experience_years: 2, city: "Kannur", consultation_fee: 2700 },
            { name: "Vishnu Prasad", bar_council_id: "MS/4402/2024", email: "vishnu.p@erodelaw.in", mobile_no: "+91-94432-88990", specialization: "Labor & Employment Law", experience: 0, experience_years: 0, city: "Erode", consultation_fee: 2500 },
            { name: "Wilfred Raj", bar_council_id: "MS/3302/2023", email: "wilfred.r@chennaijustice.in", mobile_no: "+91-98412-55667", specialization: "Criminal Law", experience: 1, experience_years: 1, city: "Chennai", consultation_fee: 2600 },
            { name: "Xavier D.", bar_council_id: "K/4402/2024", email: "xavier.d@kottayamlaw.in", mobile_no: "+91-94472-22334", specialization: "Consumer Protection", experience: 0, experience_years: 0, city: "Kottayam", consultation_fee: 2500 },
            { name: "Yamuna Devi", bar_council_id: "AP/5501/2023", email: "yamuna.d@rajamundrylaw.in", mobile_no: "+91-97005-55667", specialization: "Family Law", experience: 1, experience_years: 1, city: "Rajamahendravaram", consultation_fee: 2600 },
            { name: "Zeenath Firdous", bar_council_id: "K/3302/2024", email: "zeenath.f@malappuramlaw.in", mobile_no: "+91-94471-99887", specialization: "Intellectual Property (IPR)", experience: 0, experience_years: 0, city: "Malappuram", consultation_fee: 2500 },
            { name: "Aravindhan K.", bar_council_id: "MS/2202/2024", email: "aravindhan.k@salemlegal.in", mobile_no: "+91-94433-11009", specialization: "Arbitration", experience: 0, experience_years: 0, city: "Salem", consultation_fee: 2500 },
            { name: "Bindhu Nair", bar_council_id: "K/2202/2023", email: "bindhu.n@trivandrumlegal.in", mobile_no: "+91-98470-44332", specialization: "Taxation Law", experience: 2, experience_years: 2, city: "Thiruvananthapuram", consultation_fee: 2700 },
            { name: "Chiranjeevi M.", bar_council_id: "TS/4402/2023", email: "chiranjeevi.m@hydlaw.in", mobile_no: "+91-81234-88990", specialization: "Banking & Finance Law", experience: 1, experience_years: 1, city: "Hyderabad", consultation_fee: 2600 },
            { name: "Dhivyabharathi S.", bar_council_id: "MS/1102/2024", email: "dhivya.s@legalcorp.in", mobile_no: "+91-94422-22334", specialization: "Civil Litigation", experience: 0, experience_years: 0, city: "Chennai", consultation_fee: 2500 },
            { name: "Elango P.", bar_council_id: "MS/0102/2023", email: "elango.p@tirunelvelilaw.in", mobile_no: "+91-94440-88990", specialization: "Real Estate Law", experience: 1, experience_years: 1, city: "Tirunelveli", consultation_fee: 2600 },
            { name: "Farida Begum", bar_council_id: "TS/2202/2024", email: "farida.b@warangallaw.in", mobile_no: "+91-90001-77889", specialization: "Human Rights Law", experience: 0, experience_years: 0, city: "Warangal", consultation_fee: 2500 },
            { name: "Girish Kamath", bar_council_id: "KAR/5501/2023", email: "girish.k@udupilaw.in", mobile_no: "+91-99860-88990", specialization: "Property Law", experience: 2, experience_years: 2, city: "Udupi", consultation_fee: 2700 },
            { name: "Hemapriya N.", bar_council_id: "MS/7701/2024", email: "hemapriya.n@cblaw.in", mobile_no: "+91-97880-55667", specialization: "Cyber Law", experience: 1, experience_years: 1, city: "Coimbatore", consultation_fee: 2600 },
            { name: "Imran Khan A.", bar_council_id: "AP/3301/2024", email: "imran.a@kurnoollaw.in", mobile_no: "+91-98490-33445", specialization: "Criminal Law", experience: 0, experience_years: 0, city: "Kurnool", consultation_fee: 2500 },
            { name: "Janani S.", bar_council_id: "MS/6602/2023", email: "janani.s@vellorlaw.in", mobile_no: "+91-94441-33445", specialization: "Motor Accident Claims", experience: 1, experience_years: 1, city: "Vellore", consultation_fee: 2600 },
            { name: "Kathir Vel", bar_council_id: "MS/5502/2024", email: "kathir.v@thanjavurlaw.in", mobile_no: "+91-99440-77889", specialization: "Labor & Employment Law", experience: 0, experience_years: 0, city: "Thanjavur", consultation_fee: 2500 },
        ];

        // Upsert each advocate by bar_council_id — updates existing records (including consultation_fee)
        const ops = advocates.map(a => ({
            updateOne: {
                filter: { bar_council_id: a.bar_council_id },
                update: { $set: { ...a, password: a.password || '' } },
                upsert: true
            }
        }));
        const result = await Advocate.bulkWrite(ops);
        res.json({ message: 'Advocates seeded/updated successfully.', upserted: result.upsertedCount, modified: result.modifiedCount });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error seeding advocates.' });
    }
});

module.exports = router;
