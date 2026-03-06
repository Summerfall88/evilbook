const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing environment variables VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndFixBlobs() {
    const { data: reviews, error } = await supabase
        .from('reviews')
        .select('id, title, cover_url');

    if (error) {
        console.error('Error fetching reviews:', error);
        return;
    }

    const badReviews = reviews.filter(r => r.cover_url && r.cover_url.startsWith('blob:'));

    console.log(`\nFound ${badReviews.length} reviews with blob: URLs out of ${reviews.length} total reviews.`);

    if (badReviews.length > 0) {
        console.log("\nBad Reviews to fix:");
        for (const r of badReviews) {
            console.log(`- "${r.title}" (ID: ${r.id}) -> ${r.cover_url}`);
        }

        console.log("\nSince we cannot recover the original files from blob: URLs, these reviews will either have no cover or a default placeholder cover.");
        console.log("I am resetting their cover_url in the database to a placeholder so the UI doesn't break.");

        const placeholderUrl = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=450&fit=crop";

        for (const r of badReviews) {
            const { error: updateError } = await supabase
                .from('reviews')
                .update({ cover_url: placeholderUrl })
                .eq('id', r.id);

            if (updateError) {
                console.error(`Failed to update review ID ${r.id}:`, updateError);
            } else {
                console.log(`Successfully reset cover_url for "${r.title}"`);
            }
        }
        console.log("\nFix complete. You can now use the internal Admin panel to upload the correct covers for these books.");
    } else {
        console.log("\nNo reviews with blob: URLs found. Everything is clean!");
    }
}

checkAndFixBlobs();
