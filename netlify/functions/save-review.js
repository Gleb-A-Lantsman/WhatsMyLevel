/**
 * netlify/functions/save-review.js
 * -----------------------------------------------------------------------
 * Stores one test's REVIEW DATASET (student details, Reading/Listening
 * scores + answer breakdowns, and the list of Speaking audio links) as
 * a JSON file in Supabase Storage, and returns a short signed URL to it.
 *
 * Why this exists: the teacher's report email links to the Speaking
 * Notes review page with everything pre-filled. All that data — in
 * particular 15 long signed audio URLs — is far too big to cram into
 * the link itself (~7,000+ characters, which breaks in some email
 * clients). So instead we save it here once, and the email carries a
 * short link:  speaking-notes.html#u=<this-signed-url> . The page
 * fetches the JSON and fills itself in.
 *
 * This is deliberately SEPARATE from upload-recording.js: that function
 * is audio-shaped (it only ever writes .webm/.m4a files). This one
 * writes real .json files with the correct content-type, so the review
 * page can fetch and parse them cleanly. Same Supabase project, same
 * bucket, same private-with-signed-URL model — nothing new to configure
 * beyond deploying this file.
 *
 * Required environment variables (already set for upload-recording.js —
 * this reuses them, nothing new to add):
 *   SUPABASE_URL          — the Supabase project URL
 *   SUPABASE_SERVICE_KEY  — the Supabase service-role key
 * -----------------------------------------------------------------------
 */
const { createClient } = require('@supabase/supabase-js');

const BUCKET = 'entry-test-recordings';
// 30 days — matches the audio recordings' signed-URL lifetime, so the
// review link and the audio it points to expire together. A teacher
// reviewing within the normal turnaround (target: 3 working days) is
// well inside this window.
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

  const { sessionId, reviewData } = payload;
  if (!sessionId || !reviewData) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing sessionId or reviewData' }) };
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_KEY environment variables');
    return { statusCode: 500, body: JSON.stringify({ error: 'Server is not configured (missing Supabase credentials)' }) };
  }

  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const buffer = Buffer.from(JSON.stringify(reviewData), 'utf-8');

    // Stored next to that session's audio files, as review.json.
    const path = `${sessionId}/review.json`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: 'application/json', upsert: true });
    if (uploadError) {
      console.error('Supabase review upload error:', uploadError);
      return { statusCode: 500, body: JSON.stringify({ error: uploadError.message }) };
    }

    const { data: signedData, error: signError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, SIGNED_URL_EXPIRY_SECONDS);
    if (signError) {
      console.error('Supabase review createSignedUrl error:', signError);
      return { statusCode: 500, body: JSON.stringify({ error: signError.message }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ url: signedData.signedUrl })
    };
  } catch (err) {
    console.error('save-review error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: String(err && err.message ? err.message : err) }) };
  }
};
