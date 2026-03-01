import { supabase } from "@/integrations/supabase/client";

export interface Review {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  rating: number;
  date: string;
  text: string;
  quote?: string;
  created_at?: string;
  sortOrder?: number;
}

// Convert DB schema to local Review type
const mapReviewFromDB = (data: any): Review => ({
  id: data.id,
  title: data.title,
  author: data.author,
  coverUrl: data.cover_url,
  rating: data.rating,
  date: data.date,
  text: data.text,
  quote: data.quote || undefined,
  created_at: data.created_at,
  sortOrder: data.sort_order ?? 0,
});

export async function getReviews(): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }

  return data.map(mapReviewFromDB);
}

export async function getReviewById(id: string): Promise<Review | null> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Error fetching review ${id}:`, error);
    return null;
  }

  return mapReviewFromDB(data);
}

export async function saveReview(review: Review): Promise<void> {
  const reviewData = {
    title: review.title,
    author: review.author,
    cover_url: review.coverUrl,
    rating: review.rating,
    date: review.date,
    text: review.text,
    quote: review.quote || null,
  };

  // If review is completely new, it might come with an id from the old frontend code,
  // but let's let Supabase handle generation if we just insert.
  // We'll check if the id seems to be a valid UUID already. If not, don't pass it.
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(review.id);

  if (isUUID) {
    // Trying to update or insert with known ID
    const { error } = await supabase
      .from("reviews")
      .upsert({ ...reviewData, id: review.id } as any);

    if (error) throw error;
  } else {
    // Just insert new
    const { error } = await supabase
      .from("reviews")
      .insert(reviewData as any);

    if (error) throw error;
  }
}

export async function deleteReview(id: string): Promise<void> {
  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/**
 * Swap sort_order of two reviews (for moving up/down in admin).
 */
export async function swapReviewOrder(idA: string, orderA: number, idB: string, orderB: number): Promise<void> {
  // Swap the values
  const { error: e1 } = await supabase
    .from("reviews")
    .update({ sort_order: orderB } as any)
    .eq("id", idA);

  if (e1) throw e1;

  const { error: e2 } = await supabase
    .from("reviews")
    .update({ sort_order: orderA } as any)
    .eq("id", idB);

  if (e2) throw e2;
}
