export interface Review {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  rating: number;
  date: string;
  text: string;
}

const STORAGE_KEY = "evilbook-reviews";

const defaultReviews: Review[] = [
  {
    id: "1",
    title: "Мастер и Маргарита",
    author: "Михаил Булгаков",
    coverUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=450&fit=crop",
    rating: 5,
    date: "2026-01-15",
    text: "Роман, который невозможно прочитать один раз. Каждое перечитывание открывает новые слои смысла. Булгаков создал вселенную, в которой хочется остаться навсегда.",
  },
  {
    id: "2",
    title: "Портрет Дориана Грея",
    author: "Оскар Уайльд",
    coverUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=450&fit=crop",
    rating: 5,
    date: "2026-01-28",
    text: "Эстетизм, декаданс и моральный упадок — всё, что я люблю в литературе. Уайльд написал не просто роман, а манифест красоты и её тёмной стороны.",
  },
  {
    id: "3",
    title: "Маленькая жизнь",
    author: "Ханья Янагихара",
    coverUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=450&fit=crop",
    rating: 4,
    date: "2026-02-01",
    text: "Книга, которая ломает тебя и собирает заново. Болезненная, жестокая, но невероятно честная история о дружбе, травме и любви.",
  },
  {
    id: "4",
    title: "Щегол",
    author: "Донна Тартт",
    coverUrl: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=300&h=450&fit=crop",
    rating: 4,
    date: "2025-12-20",
    text: "Тартт умеет писать так, что ты чувствуешь запах каждой комнаты. Эпическая история о потере, искусстве и поиске себя.",
  },
  {
    id: "5",
    title: "Ребекка",
    author: "Дафна дю Морье",
    coverUrl: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=300&h=450&fit=crop",
    rating: 5,
    date: "2025-12-05",
    text: "Готический роман в своём лучшем проявлении. Атмосфера Мэндерли окутывает с первых страниц и не отпускает до финала.",
  },
  {
    id: "6",
    title: "Тайная история",
    author: "Донна Тартт",
    coverUrl: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=300&h=450&fit=crop",
    rating: 5,
    date: "2025-11-18",
    text: "Тёмная академия во всей красе. Группа студентов, одержимых античностью, переходит все границы. Идеальный роман для осенних вечеров.",
  },
  {
    id: "7",
    title: "Норвежский лес",
    author: "Харуки Мураками",
    coverUrl: "https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=300&h=450&fit=crop",
    rating: 3,
    date: "2025-11-01",
    text: "Меланхоличная и тихая история о юности и потере. Мураками пишет так, словно каждое слово — вздох.",
  },
];

export function getReviews(): Review[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultReviews));
  return defaultReviews;
}

export function saveReview(review: Review): void {
  const reviews = getReviews();
  const idx = reviews.findIndex((r) => r.id === review.id);
  if (idx >= 0) {
    reviews[idx] = review;
  } else {
    reviews.unshift(review);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
}

export function deleteReview(id: string): void {
  const reviews = getReviews().filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
}
