import { json } from '@sveltejs/kit';
import crosswords from '$lib/data/crosswords.json';
import themedCrosswords from '$lib/data/themed_crosswords.json';

const DEFAULT_DAYS_AHEAD = 21; // 3 weeks
const MAX_DAYS_AHEAD = 365;

/** Returns today's date string (YYYY-MM-DD) in US Eastern time. */
function todayEST() {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
}

/** Adds `days` calendar days to a YYYY-MM-DD string and returns the new string. */
function addDays(dateStr, days) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(Date.UTC(year, month - 1, day + days));
    return d.toISOString().slice(0, 10);
}

export async function GET({ url }) {
    try {
        const rawDays = url.searchParams.get('days');
        const daysAhead = rawDays !== null
            ? Math.min(Math.max(parseInt(rawDays, 10) || DEFAULT_DAYS_AHEAD, 1), MAX_DAYS_AHEAD)
            : DEFAULT_DAYS_AHEAD;

        const today = todayEST();
        const cutoff = addDays(today, daysAhead);

        // Daily crosswords: return full objects for dates in [today, cutoff]
        const upcomingDaily = Object.entries(crosswords)
            .filter(([date]) => date >= today && date <= cutoff)
            .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
            .reduce((acc, [date, puzzle]) => {
                acc[date] = puzzle;
                return acc;
            }, {});

        // Themed crosswords: return full objects whose date_available falls in [today, cutoff]
        const upcomingThemed = Object.values(themedCrosswords)
            .filter((puzzle) => {
                const d = puzzle.date_available;
                return d && d >= today && d <= cutoff;
            })
            .sort((a, b) => (a.date_available < b.date_available ? -1 : a.date_available > b.date_available ? 1 : 0));

        return json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            window: { from: today, to: cutoff, days: daysAhead },
            daily: upcomingDaily,
            themed: upcomingThemed
        });
    } catch (error) {
        console.error('Monitor upcoming endpoint error:', error);
        return json(
            {
                status: 'error',
                timestamp: new Date().toISOString(),
                error: 'Failed to build upcoming crosswords preview'
            },
            { status: 500 }
        );
    }
}
