const express = require('express');
const router = express.Router();
const axios = require('axios');
const authMiddleware = require('../middleware/auth');

// Indian court holiday calendars (public Google Calendar IDs)
// Using Indian national holidays calendar
const CALENDAR_IDS = [
    'en.indian#holiday@group.v.calendar.google.com', // Indian Holidays
];

// Fetch court holidays from Google Calendar API
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { year } = req.query;
        const targetYear = parseInt(year) || new Date().getFullYear();

        const timeMin = `${targetYear}-01-01T00:00:00Z`;
        const timeMax = `${targetYear}-12-31T23:59:59Z`;
        const apiKey = process.env.GOOGLE_API_KEY;

        let allHolidays = {};

        for (const calendarId of CALENDAR_IDS) {
            try {
                const encodedId = encodeURIComponent(calendarId);
                const url = `https://www.googleapis.com/calendar/v3/calendars/${encodedId}/events?key=${apiKey}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=100`;
                const response = await axios.get(url);
                const events = response.data.items || [];

                events.forEach(event => {
                    const date = event.start?.date || event.start?.dateTime?.split('T')[0];
                    if (date) {
                        allHolidays[date] = event.summary;
                    }
                });
            } catch (calErr) {
                console.warn(`Failed to fetch calendar ${calendarId}:`, calErr.message);
            }
        }

        // If Google Calendar returns no results or fails, return curated Indian court holidays
        if (Object.keys(allHolidays).length === 0) {
            allHolidays = getStaticHolidays(targetYear);
        }

        res.json({ holidays: allHolidays, year: targetYear, source: Object.keys(allHolidays).length > 0 ? 'google' : 'static' });
    } catch (err) {
        console.error('Holiday API error:', err.message);
        // Fallback to static holidays
        const targetYear = parseInt(req.query.year) || new Date().getFullYear();
        res.json({ holidays: getStaticHolidays(targetYear), year: targetYear, source: 'static' });
    }
});

// Static Indian court holidays fallback
function getStaticHolidays(year) {
    const holidays = {
        [`${year}-01-01`]: "New Year's Day",
        [`${year}-01-14`]: 'Makar Sankranti / Pongal',
        [`${year}-01-26`]: 'Republic Day',
        [`${year}-03-25`]: 'Holi',
        [`${year}-04-02`]: 'Ram Navami',
        [`${year}-04-03`]: 'Good Friday',
        [`${year}-04-14`]: 'Dr. Ambedkar Jayanti',
        [`${year}-05-01`]: 'Maharashtra Day / Labour Day',
        [`${year}-06-17`]: 'Eid ul-Adha',
        [`${year}-08-15`]: 'Independence Day',
        [`${year}-08-22`]: 'Janmashtami',
        [`${year}-09-02`]: 'Ganesh Chaturthi',
        [`${year}-10-02`]: 'Gandhi Jayanti / Dussehra',
        [`${year}-10-20`]: 'Diwali',
        [`${year}-10-21`]: 'Diwali (Lakshmi Puja)',
        [`${year}-11-05`]: 'Guru Nanak Jayanti',
        [`${year}-12-25`]: 'Christmas Day',
    };
    return holidays;
}

module.exports = router;
