/**
 * netlify/functions/upload-recording.js
 * -----------------------------------------------------------------------
 * Receives one Speaking answer's recorded audio (as base64) from the
 * browser and stores it in Supabase Storage, in the SAME Supabase
 * project already used for Royal Herald — just a new bucket.
 *
 * Required environment variables (set in Netlify, never in the code):
 *   SUPABASE_URL          — e.g. https://gbumrehhicixybuugxcd.supabase.co
 *   SUPABASE_SERVICE_KEY  — the *service role* key (Project Settings →
 *                            API → service_role), NOT the public anon key.
 *                            This key can write to storage, so it must
 *                            only ever live server-side.
 *
 * Expects the bucket below to already exist and be set to Public.
 * -----------------------------------------------------------------------
 */
const { createClient } = require('@supabase/supabase-js');

const BUCKET = 'entry-test-recordings';

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

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

    return {
      statusCode: 200,
      body: JSON.stringify({ url: data.publicUrl })
    };
  } catch (err) {
    console.error('upload-recording error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: String(err && err.message ? err.message : err) }) };
  }
};
