import { json } from '@sveltejs/kit';

export async function POST({ request }) {
  try {
    const { url } = await request.json();
    
    if (!url || typeof url !== 'string') {
      return json({ 
        error: 'URL is required',
        status: 'invalid'
      }, { status: 400 });
    }

    // Normalize the URL
    let normalizedUrl = url.trim();
    
    // Remove leading '@' that some apps prepend
    if (normalizedUrl.startsWith('@')) {
      normalizedUrl = normalizedUrl.slice(1).trim();
    }
    
    // Ensure it starts with http(s)
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    // Validate it's a SoundCloud URL
    let urlObj;
    try {
      urlObj = new URL(normalizedUrl);
    } catch {
      return json({
        error: 'Invalid URL format',
        status: 'invalid'
      }, { status: 400 });
    }

    const validHosts = [
      'soundcloud.com',
      'www.soundcloud.com', 
      'on.soundcloud.com',
      'm.soundcloud.com'
    ];

    if (!validHosts.includes(urlObj.hostname)) {
      return json({
        error: 'Please enter a valid SoundCloud URL',
        status: 'invalid'
      }, { status: 400 });
    }

    // Strip common tracking params to stabilize the URL
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'ref', 'si', 'p', 'c'
    ];
    trackingParams.forEach(param => urlObj.searchParams.delete(param));
    normalizedUrl = urlObj.toString();

    // Call SoundCloud oEmbed API from server-side to avoid CORS issues
    const oembedUrl = `https://soundcloud.com/oembed?format=json&maxheight=120&show_teaser=false&show_comments=false&url=${encodeURIComponent(normalizedUrl)}`;
    
    const response = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'Crosstune/1.0 (+https://crosstune.io)',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!response.ok) {
      console.error(`SoundCloud oEmbed API returned ${response.status} for URL: ${normalizedUrl}`);
      
      // More specific error messages based on status code
      let errorMessage = 'Error checking SoundCloud URL. Please try again.';
      if (response.status === 404) {
        errorMessage = 'SoundCloud track not found. Please check the URL.';
      } else if (response.status === 403) {
        errorMessage = 'SoundCloud track is private or restricted.';
      } else if (response.status >= 500) {
        errorMessage = 'SoundCloud service temporarily unavailable. Please try again later.';
      }
      
      return json({
        error: errorMessage,
        status: 'error',
        httpStatus: response.status
      }, { status: 400 });
    }

    const data = await response.json();
    
    if (!data.html) {
      return json({
        error: 'Invalid SoundCloud response - no embed data found',
        status: 'invalid'
      }, { status: 400 });
    }

    // Extract track ID from the iframe src using multiple patterns
    const patterns = [
      /tracks%2F(\d+)/, // URL-encoded format: tracks%2F123456
      /tracks\/(\d+)/, // Direct format: tracks/123456
      /api\.soundcloud\.com\/(tracks|playlists)\/(\d+)/, // Original format
    ];

    let trackId = null;
    let resourceType = null;

    for (const pattern of patterns) {
      const match = data.html.match(pattern);
      if (match) {
        trackId = match[1] || match[2]; // Handle different capture groups
        resourceType = match[1] === trackId ? 'tracks' : match[1] || 'tracks';
        break;
      }
    }

    if (!trackId || resourceType !== 'tracks') {
      console.error('Could not extract track ID from SoundCloud embed HTML:', data.html);
      return json({
        error: 'Could not find a valid SoundCloud track. Make sure it\'s a track (not a playlist).',
        status: 'invalid'
      }, { status: 400 });
    }

    // Success response
    return json({
      status: 'valid',
      trackId: Number(trackId),
      normalizedUrl: normalizedUrl,
      type: resourceType,
      message: 'Track found and ready for timing'
    });

  } catch (error) {
    console.error('Error validating SoundCloud URL:', error);
    
    // Handle timeout errors specifically
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return json({
        error: 'Request timed out. Please check your connection and try again.',
        status: 'error'
      }, { status: 408 });
    }
    
    return json({
      error: 'Error checking SoundCloud URL. Please try again.',
      status: 'error'
    }, { status: 500 });
  }
}
