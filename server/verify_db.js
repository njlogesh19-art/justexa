const mongoose = require('mongoose');
require('dotenv').config();

async function verify() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const count = await mongoose.connection.db.collection('advocates').countDocuments();
        // Check for experience < 3 years
        const juniors = await mongoose.connection.db.collection('advocates').countDocuments({
            $or: [
                { experience_years: { $lt: 3 } },
                { experience: { $lt: 3 } }
            ]
        });
        console.log(JSON.stringify({ total: count, juniors: juniors, percent_junior: (juniors / count * 100).toFixed(1) + '%' }));
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

verify();
