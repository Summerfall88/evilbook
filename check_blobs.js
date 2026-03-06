import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBlobs() {
    const { data, error } = await supabase
        .from('reviews')
        .select('id, title, cover_url');

    if (error) {
        console.error('Error:', error);
        return;
    }

    const badReviews = data.filter(r => r.cover_url && r.cover_url.startsWith('blob:'));
    console.log(`Found ${badReviews.length} reviews with blob: URLs out of ${data.length} total reviews.`);

    for (const r of badReviews) {
        console.log(`- ${r.title} (ID: ${r.id}) -> ${r.cover_url}`);
    }
}

checkBlobs();
