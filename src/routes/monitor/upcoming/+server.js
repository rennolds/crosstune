import { json } from '@sveltejs/kit';
import crosswords from '$lib/data/crosswords.json';
import themedCrosswords from '$lib/data/themed_crosswords.json';

const WEEKS_AHEAD = 3;

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

export async function GET() {
  try {
    const today = todayEST();
    const cutoff = addDays(today, WEEKS_AHEAD * 7);

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
      window: { from: today, to: cutoff, weeks: WEEKS_AHEAD },
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
