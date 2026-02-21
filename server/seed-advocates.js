const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '../.env' });

const advocateSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    bar_council_id: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    mobile_no: { type: String, trim: true, default: '' },
    specialization: { type: String, required: true, trim: true },
    experience: { type: Number, min: 0, default: 0 },
    experience_years: { type: Number, min: 0, default: 0 },
    city: { type: String, trim: true, default: '' },
    consultation_fee: { type: Number, min: 0, default: 0 },
    password: { type: String, default: '' },
    role: { type: String, default: 'advocate', enum: ['advocate'] }
}, { timestamps: true });

const Advocate = mongoose.model('Advocate', advocateSchema);

// Fee range: ₹2500 – ₹4000 (multiples of 100)

const advocates = [
    { name: "S. Muthukumaran", bar_council_id: "MS/1645/2012", email: "muthukumaran.s@chennailaw.in", mobile_no: "+91-94440-12345", specialization: "Criminal Law", experience: 14, experience_years: 14, city: "Chennai", consultation_fee: 2800 },
    { name: "Lakshmi Narayana Iyer", bar_council_id: "MS/0392/2005", email: "lakshmi.iyer@advocate.in", mobile_no: "+91-98400-56789", specialization: "Constitutional Law", experience: 21, experience_years: 21, city: "Madurai", consultation_fee: 3900 },
    { name: "Praveen Kumar Gowda", bar_council_id: "KAR/2105/2018", email: "praveen.gowda@blrlaw.com", mobile_no: "+91-91234-99887", specialization: "Real Estate & Property Law", experience: 8, experience_years: 8, city: "Bengaluru", consultation_fee: 2700 },
    { name: "Meenakshi Sundaram", bar_council_id: "MS/0825/2010", email: "m.sundaram@justice.org", mobile_no: "+91-94431-44556", specialization: "Civil Litigation", experience: 16, experience_years: 16, city: "Coimbatore", consultation_fee: 3100 },
    { name: "Ananthakrishnan Menon", bar_council_id: "K/1123/2015", email: "a.menon@keralalegal.in", mobile_no: "+91-98470-33221", specialization: "Family Law", experience: 11, experience_years: 11, city: "Kochi", consultation_fee: 2900 },
    { name: "Sugali Mahesh Naik", bar_council_id: "AP/351/2023", email: "mahesh.naik@apbar.in", mobile_no: "+91-97001-11002", specialization: "Labor & Employment Law", experience: 3, experience_years: 3, city: "Vijayawada", consultation_fee: 2500 },
    { name: "Rajeshwari Venkat", bar_council_id: "TS/7732/2019", email: "r.venkat@hydlaw.in", mobile_no: "+91-81234-55667", specialization: "Intellectual Property (IPR)", experience: 7, experience_years: 7, city: "Hyderabad", consultation_fee: 3000 },
    { name: "Kiran Hegde", bar_council_id: "KAR/0554/2014", email: "kiran.hegde@mangalorelaw.com", mobile_no: "+91-99001-22334", specialization: "Banking & Finance Law", experience: 12, experience_years: 12, city: "Mangaluru", consultation_fee: 3300 },
    { name: "B. Santhana Krishnan", bar_council_id: "MS/2671/2014", email: "santhana.k@chennaiadvocate.in", mobile_no: "+91-94433-22110", specialization: "Taxation Law", experience: 12, experience_years: 12, city: "Chennai", consultation_fee: 2800 },
    { name: "Divya Pillai", bar_council_id: "K/0654/2020", email: "divya.pillai@cochinbar.in", mobile_no: "+91-95622-77889", specialization: "Environmental Law", experience: 6, experience_years: 6, city: "Thiruvananthapuram", consultation_fee: 2600 },
    { name: "Venkata Ramanujam", bar_council_id: "AP/1290/2011", email: "v.ramanujam@vizaglegal.com", mobile_no: "+91-98480-12345", specialization: "Corporate Law", experience: 15, experience_years: 15, city: "Visakhapatnam", consultation_fee: 3800 },
    { name: "Shalini Reddy", bar_council_id: "TS/4432/2016", email: "shalini.reddy@hydbar.org", mobile_no: "+91-73308-44556", specialization: "Family Law", experience: 10, experience_years: 10, city: "Hyderabad", consultation_fee: 2900 },
    { name: "Arun Shabari K.R.", bar_council_id: "MS/4116/2015", email: "arun.shabari@legalcorp.in", mobile_no: "+91-94422-88990", specialization: "Criminal Law", experience: 11, experience_years: 11, city: "Salem", consultation_fee: 2700 },
    { name: "Siddharth Nambiar", bar_council_id: "K/0085/2021", email: "sid.nambiar@thrissurlaw.com", mobile_no: "+91-94470-11223", specialization: "Cyber Law", experience: 5, experience_years: 5, city: "Thrissur", consultation_fee: 2500 },
    { name: "Manjunath Swamy", bar_council_id: "KAR/6940/2021", email: "m.swamy@hublilegal.in", mobile_no: "+91-80881-22334", specialization: "Arbitration & Mediation", experience: 5, experience_years: 5, city: "Hubballi", consultation_fee: 2600 },
    { name: "Priscilla Pandian", bar_council_id: "MS/2311/2010", email: "priscilla.p@yahoo.co.in", mobile_no: "+91-94427-25555", specialization: "Civil Litigation", experience: 16, experience_years: 16, city: "Tuticorin", consultation_fee: 3000 },
    { name: "Gopalakrishnan Nair", bar_council_id: "K/3241/2013", email: "g.nair@keralabar.org", mobile_no: "+91-98460-99887", specialization: "Insurance Law", experience: 13, experience_years: 13, city: "Kozhikode", consultation_fee: 2900 },
    { name: "Harish Rao", bar_council_id: "TS/2210/2017", email: "harish.rao@warangallaw.in", mobile_no: "+91-90001-55667", specialization: "Criminal Law", experience: 9, experience_years: 9, city: "Warangal", consultation_fee: 2600 },
    { name: "Kavitha Murthy", bar_council_id: "KAR/3345/2012", email: "kavitha.m@mysorelaw.in", mobile_no: "+91-99860-44332", specialization: "Property Law", experience: 14, experience_years: 14, city: "Mysuru", consultation_fee: 3700 },
    { name: "Arul Alex", bar_council_id: "MS/1399/2019", email: "arul.alex@trichylegal.com", mobile_no: "+91-99440-31249", specialization: "Motor Accident Claims", experience: 7, experience_years: 7, city: "Trichy", consultation_fee: 2700 },
    { name: "Sreejith Warrier", bar_council_id: "K/5404/2021", email: "sreejith.w@malappuramlaw.in", mobile_no: "+91-94471-88990", specialization: "Civil Litigation", experience: 5, experience_years: 5, city: "Malappuram", consultation_fee: 2500 },
    { name: "Deepthi Goud", bar_council_id: "AP/8834/2015", email: "deepthi.g@kurnoollaw.com", mobile_no: "+91-98490-77665", specialization: "Family Law", experience: 11, experience_years: 11, city: "Kurnool", consultation_fee: 3600 },
    { name: "Karthik Subramanian", bar_council_id: "MS/0589/2021", email: "karthik.s@madurailaw.in", mobile_no: "+91-97880-11223", specialization: "Intellectual Property (IPR)", experience: 5, experience_years: 5, city: "Madurai", consultation_fee: 2600 },
    { name: "Reshma Kurup", bar_council_id: "K/1728/2007", email: "reshma.k@palakkadlaw.in", mobile_no: "+91-98461-44556", specialization: "Banking & Finance Law", experience: 19, experience_years: 19, city: "Palakkad", consultation_fee: 4000 },
    { name: "Raghavendra Chittoor", bar_council_id: "AP/5549/2011", email: "r.chittoor@tirupatilaw.in", mobile_no: "+91-99890-55667", specialization: "Criminal Law", experience: 15, experience_years: 15, city: "Tirupati", consultation_fee: 3200 },
    { name: "Sneha Mallesh", bar_council_id: "KAR/1129/2020", email: "sneha.m@belgaumlaw.in", mobile_no: "+91-97411-88990", specialization: "Human Rights Law", experience: 6, experience_years: 6, city: "Belagavi", consultation_fee: 2600 },
    { name: "J. Priscilla", bar_council_id: "MS/2612/2017", email: "j.priscilla@chennaicourt.in", mobile_no: "+91-94421-33221", specialization: "Family Law", experience: 9, experience_years: 9, city: "Chennai", consultation_fee: 2800 },
    { name: "Mohan Raj", bar_council_id: "MS/3248/2015", email: "mohan.raj@salemlegal.com", mobile_no: "+91-94432-77310", specialization: "Real Estate Law", experience: 11, experience_years: 11, city: "Salem", consultation_fee: 3700 },
    { name: "Vinayaka Bhat", bar_council_id: "KAR/0465/2019", email: "vinayaka.b@shimogalaw.in", mobile_no: "+91-94172-84926", specialization: "Cyber Law", experience: 7, experience_years: 7, city: "Shivamogga", consultation_fee: 2700 },
    { name: "Soumya Sathyan", bar_council_id: "K/9903/2015", email: "soumya.s@kottayamlaw.in", mobile_no: "+91-94472-11009", specialization: "Consumer Protection", experience: 11, experience_years: 11, city: "Kottayam", consultation_fee: 2900 },
    { name: "Ramachandra Rao", bar_council_id: "TS/3321/2012", email: "r.rao@hydjustice.org", mobile_no: "+91-98481-99887", specialization: "Constitutional Law", experience: 14, experience_years: 14, city: "Hyderabad", consultation_fee: 3900 },
    { name: "Arul Kannappan", bar_council_id: "MS/4088/2015", email: "arul.k@legalpro.in", mobile_no: "+91-98410-22881", specialization: "Civil Litigation", experience: 11, experience_years: 11, city: "Chennai", consultation_fee: 2800 },
    { name: "Latha Maheshwari", bar_council_id: "KAR/5541/2016", email: "latha.m@blrbar.com", mobile_no: "+91-99861-55443", specialization: "Arbitration", experience: 10, experience_years: 10, city: "Bengaluru", consultation_fee: 3000 },
    { name: "Bharath Kumar", bar_council_id: "AP/8820/2021", email: "bharath.k@nellorelaw.in", mobile_no: "+91-90001-33445", specialization: "Criminal Law", experience: 5, experience_years: 5, city: "Nellore", consultation_fee: 2500 },
    { name: "Sujatha Krishnan", bar_council_id: "MS/0135/2021", email: "sujatha.k@vjlegal.in", mobile_no: "+91-94441-22334", specialization: "Intellectual Property (IPR)", experience: 5, experience_years: 5, city: "Chennai", consultation_fee: 2600 },
    { name: "Ganesh Hegde", bar_council_id: "KAR/2375/2012", email: "ganesh.h@karwarlegal.in", mobile_no: "+91-97422-55667", specialization: "Insurance Law", experience: 14, experience_years: 14, city: "Karwar", consultation_fee: 3100 },
    { name: "Rahul Deshpande", bar_council_id: "KAR/2210/2014", email: "rahul.d@dharwadlaw.com", mobile_no: "+91-91188-77665", specialization: "Corporate Law", experience: 12, experience_years: 12, city: "Dharwad", consultation_fee: 3800 },
    { name: "Anjali Bose", bar_council_id: "K/1657/2020", email: "anjali.b@kollambar.in", mobile_no: "+91-95677-44332", specialization: "Human Rights Law", experience: 6, experience_years: 6, city: "Kollam", consultation_fee: 2700 },
    { name: "Satish Chandra", bar_council_id: "AP/4431/2012", email: "s.chandra@gunturlaw.in", mobile_no: "+91-98485-11009", specialization: "Property Law", experience: 14, experience_years: 14, city: "Guntur", consultation_fee: 3000 },
    { name: "Vivek Shenoy", bar_council_id: "K/6654/2016", email: "vivek.shenoy@ernakulamlaw.in", mobile_no: "+91-94460-22110", specialization: "Cyber Law", experience: 10, experience_years: 10, city: "Kochi", consultation_fee: 2900 },
    { name: "Akshai Mani", bar_council_id: "MS/1639/2014", email: "akshai.mani@tnlegal.in", mobile_no: "+91-94441-62358", specialization: "Maritime Law", experience: 12, experience_years: 12, city: "Chennai", consultation_fee: 4000 },
    { name: "Pavan Kalyan", bar_council_id: "TS/9902/2013", email: "pavan.k@hydlegal.in", mobile_no: "+91-99080-11223", specialization: "Criminal Law", experience: 13, experience_years: 13, city: "Hyderabad", consultation_fee: 3000 },
    { name: "Deepak Thampi", bar_council_id: "K/2857/2024", email: "deepak.thampi@wayanadlaw.com", mobile_no: "+91-94475-66778", specialization: "Environmental Law", experience: 2, experience_years: 2, city: "Kalpetta", consultation_fee: 2500 },
    { name: "Chandrasekhar R.", bar_council_id: "MS/0085/2021", email: "c.sekhar@chennaijustice.com", mobile_no: "+91-98402-98926", specialization: "Labor Law", experience: 5, experience_years: 5, city: "Chennai", consultation_fee: 2600 },
    { name: "Navya Sree", bar_council_id: "AP/6652/2018", email: "navya.sree@apbar.gov.in", mobile_no: "+91-97005-44332", specialization: "Civil Litigation", experience: 8, experience_years: 8, city: "Amaravati", consultation_fee: 2700 },
    { name: "Arunachalam M.", bar_council_id: "MS/0229/2018", email: "arun.adv.cbe@gmail.com", mobile_no: "+91-98422-35133", specialization: "Real Estate Law", experience: 8, experience_years: 8, city: "Coimbatore", consultation_fee: 3600 },
    { name: "S. Vijay", bar_council_id: "MS/1245/2000", email: "vijay.lawyer@chennai.in", mobile_no: "+91-98412-33445", specialization: "Corporate Law", experience: 26, experience_years: 26, city: "Chennai", consultation_fee: 4000 },
    { name: "Rahul Varma", bar_council_id: "KAR/0987/2013", email: "rahul.varma@blrlegal.in", mobile_no: "+91-99450-98765", specialization: "Criminal Law", experience: 13, experience_years: 13, city: "Bengaluru", consultation_fee: 3000 },
    { name: "Biju Joseph", bar_council_id: "K/1442/2008", email: "biju.j@keralalegal.com", mobile_no: "+91-94465-12345", specialization: "Civil Litigation", experience: 18, experience_years: 18, city: "Kochi", consultation_fee: 3800 },
    { name: "Sita Ram", bar_council_id: "TS/3342/2022", email: "sitaram.adv@hydlaw.in", mobile_no: "+91-73309-88776", specialization: "Family Law", experience: 4, experience_years: 4, city: "Hyderabad", consultation_fee: 2500 },
];


async function seed() {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/justexa';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('Connected!');

    await Advocate.deleteMany({});
    const result = await Advocate.insertMany(advocates.map(a => ({ ...a, password: '' })));
    console.log(`✅ Seeded ${result.length} advocates into MongoDB.`);

    await mongoose.disconnect();
    process.exit(0);
}

seed().catch(err => {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
});
