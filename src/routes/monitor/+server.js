import { json } from '@sveltejs/kit';
import crosswords from '$lib/data/crosswords.json';

export async function GET() {
  try {
    // Extract and return only the dates from crosswords data
    const dates = Object.keys(crosswords);
    
    return json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      dates: dates
    });
  } catch (error) {
    console.error('Monitor endpoint error:', error);
    return json(
      { 
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Failed to read crosswords data' 
      },
      { status: 500 }
    );
  }
}

