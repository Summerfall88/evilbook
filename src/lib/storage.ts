import { supabase } from "@/integrations/supabase/client";

/**
 * Uploads an image file to the Supabase 'review-covers' storage bucket.
 *
 * @param file The image file to upload
 * @returns The public URL of the uploaded image
 * @throws Error if the upload fails
 */
export async function uploadReviewCover(file: File): Promise<string> {
    // Generate a unique filename using timestamp and a random string to prevent collisions
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('review-covers')
        .upload(filePath, file);

    if (uploadError) {
        console.error('Error uploading image to Supabase:', uploadError);
        throw new Error('Не удалось загрузить изображение');
    }

    // Get the public URL for the uploaded image
    const { data } = supabase.storage
        .from('review-covers')
        .getPublicUrl(filePath);

    return data.publicUrl;
}
