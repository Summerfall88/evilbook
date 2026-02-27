# Настройка таблицы Рецензий (Reviews) в Supabase

Для того чтобы рецензии сохранялись в глобальной базе данных и были доступны всем пользователям, необходимо создать соответствующую таблицу в Supabase и настроить правила доступа (RLS).

## Шаг 1: Создание таблицы и политик безопасности

1. Откройте панель управления **Supabase**.
2. Перейдите в раздел **SQL Editor**.
3. Создайте новый запрос (**New Query**).
4. Скопируйте следующий SQL-код, вставьте его в редактор и нажмите **Run**:

```sql
-- 1. Создание таблицы reviews
CREATE TABLE public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    cover_url TEXT NOT NULL,
    rating INTEGER NOT NULL,
    date DATE NOT NULL,
    text TEXT NOT NULL,
    quote TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Включаем RLS (Row Level Security)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 3. Политика: Чтение доступно всем (включая анонимных пользователей)
CREATE POLICY "Anyone can view reviews" 
ON public.reviews 
FOR SELECT 
USING ( true );

-- 4. Политика: Создание доступно только администраторам
CREATE POLICY "Admins can insert reviews" 
ON public.reviews 
FOR INSERT 
TO authenticated 
WITH CHECK ( public.is_admin() );

-- 5. Политика: Редактирование доступно только администраторам
CREATE POLICY "Admins can update reviews" 
ON public.reviews 
FOR UPDATE 
TO authenticated 
USING ( public.is_admin() )
WITH CHECK ( public.is_admin() );

-- 6. Политика: Удаление доступно только администраторам
CREATE POLICY "Admins can delete reviews" 
ON public.reviews 
FOR DELETE 
TO authenticated 
USING ( public.is_admin() );
```

После успешного выполнения этого запроса таблица будет создана, и только администраторы (вы) смогут добавлять, изменять и удалять рецензии. Все остальные пользователи (включая неавторизованных) смогут их только читать.
