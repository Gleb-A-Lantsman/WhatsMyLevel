/**
 * netlify/functions/upload-recording.js
 * -----------------------------------------------------------------------
 * Receives one Speaking answer's recorded audio (as base64) from the
 * browser and stores it in Supabase Storage, in the SAME Supabase
 * project already used for Royal Herald — just a new bucket.
 *
 * The bucket is PRIVATE (not public). Instead of a permanent public
 * URL, this returns a signed URL that's valid for SIGNED_URL_EXPIRY_
 * SECONDS below — long enough for a teacher to open the report email
 * and listen to every recording, but the link itself expires rather
 * than staying live forever.
 * -----------------------------------------------------------------------
 */
const { createClient } = require('@supabase/supabase-js');
const BUCKET = 'entry-test-recordings';

// 30 days — generous enough that a teacher reviewing late won't hit a
// dead link, but the recording isn't permanently public either.
const SIGNED_URL_EXPIRY_SECONDS = 30 * 24 * 60 * 60;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }
  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }
  const { sessionId, questionId, mimeType, audioBase64 } = payload;
  if (!sessionId || !questionId || !audioBase64) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing sessionId, questionId, or audioBase64' }) };
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_KEY environment variables');
    return { statusCode: 500, body: JSON.stringify({ error: 'Server is not configured (missing Supabase credentials)' }) };
  }
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const buffer = Buffer.from(audioBase64, 'base64');
    const ext = mimeType && mimeType.includes('mp4') ? 'm4a' : 'webm';
    const path = `${sessionId}/${questionId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: mimeType || 'audio/webm', upsert: true });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return { statusCode: 500, body: JSON.stringify({ error: uploadError.message }) };
    }

    // Bucket is private, so build a time-limited signed URL instead of
    // a permanent public one.
    const { data: signedData, error: signError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, SIGNED_URL_EXPIRY_SECONDS);

    if (signError) {
      console.error('Supabase createSignedUrl error:', signError);
      return { statusCode: 500, body: JSON.stringify({ error: signError.message }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ url: signedData.signedUrl })
    };
  } catch (err) {
    console.error('upload-recording error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: String(err && err.message ? err.message : err) }) };
  }
};
