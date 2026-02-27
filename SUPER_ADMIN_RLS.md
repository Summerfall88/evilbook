# Настройка политик безопасности (RLS) для администраторов

Для того чтобы администраторы могли управлять пользователями (менять им роли) и удалять любые комментарии, нам нужно создать специальные SQL-политики (Policies) в базе данных. 

Так как нам нужно проверять роль пользователя в той же таблице `profiles` (которая защищена RLS политиками), мы сначала создадим функцию-помощник с флагом `SECURITY DEFINER`, чтобы избежать ошибки "бесконечной рекурсии" (infinite recursion).

## Шаг 1: Создание функции проверки прав администратора

1. Откройте панель управления **Supabase**.
2. Перейдите в раздел **SQL Editor**.
3. Создайте новый запрос (**New Query**).
4. Вставьте следующий код и нажмите **Run**:

```sql
-- Создаем функцию для проверки, является ли текущий пользователь админом
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql 
SECURITY DEFINER -- Позволяет игнорировать RLS при проверке
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;
```

## Шаг 2: Политики для таблицы `profiles` (Управление пользователями)

Теперь разрешим администраторам видеть список всех пользователей и изменять их профили.
Вставьте следующий код в SQL Editor и нажмите **Run**:

```sql
-- Разрешаем админам видеть все профили
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING ( public.is_admin() );

-- Разрешаем админам обновлять любые профили (менять роли и статус)
CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING ( public.is_admin() )
WITH CHECK ( public.is_admin() );
```
*(Примечание: если у вас уже есть политика выборки (SELECT) для всех авторизованных пользователей, первая политика не навредит, но ее можно пропустить).*

## Шаг 3: Политики для таблицы `comments` (Модерация комментариев)

Теперь дадим админам право удалять абсолютно любые комментарии.
Вставьте следующий код в SQL Editor и нажмите **Run**:

```sql
-- Разрешаем админам удалять любые комментарии
CREATE POLICY "Admins can delete any comments" 
ON public.comments 
FOR DELETE 
TO authenticated 
USING ( public.is_admin() );
```

---

Вот и всё! 🎉 Теперь ваш Admin-интерфейс Evilbook полностью защищен на уровне базы данных. Обычные пользователи не смогут менять роли или удалять чужие комментарии даже через API, поскольку этому воспрепятствует база данных (Supabase).
