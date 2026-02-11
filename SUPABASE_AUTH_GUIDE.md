# Best Practices: Supabase Auth in React

When building authentication with Supabase in React applications, follow these patterns to avoid race conditions, "flickering" loading states, and deadlocks.

## 1. The Golden Rule: Single Source of Truth

**❌ Anti-Pattern (What went wrong):**
Calling `getSession()` manually AND listening to `onAuthStateChange`.
```typescript
// DON'T DO THIS
useEffect(() => {
  supabase.auth.getSession().then(...) // Race condition 1
  supabase.auth.onAuthStateChange(...) // Race condition 2
}, []);
```
*Why it fails:* `getSession` is async. `onAuthStateChange` might fire before or after `getSession` returns. You might set `user` to `null` (loading) then `user` (session) then `null` (logout event), causing unpredictable state flips.

**✅ Best Practice:**
Use **only** `onAuthStateChange`. It automatically handles the initial session check on mount.
```typescript
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null);
    setLoading(false); // Critical: Stop loading immediately
  });
  return () => subscription.unsubscribe();
}, []);
```

## 2. Non-Blocking Metadata Fetching

**❌ Anti-Pattern:**
Waiting for profile data before setting `loading` to `false`.
```typescript
// DON'T DO THIS
if (session?.user) {
  await fetchProfile(session.user.id); // BLOCKS the entire app!
  setLoading(false); 
}
```
*Why it fails:* If the network is slow or the profile fetch hangs, your **entire application remains on a blank white screen** or loading spinner. Users cannot interact with the parts of the app that don't need the profile name.

**✅ Best Practice:**
Set `loading(false)` as soon as you know *who* the user is (or that they are anonymous). Fetch profile data in the background.

```typescript
// DO THIS
if (session?.user) {
  setUser(session.user);
  setLoading(false); // App becomes interactive immediately!
  
  // Fetch profile in background
  fetchProfile(session.user.id).then(updateDisplayName);
} else {
  setLoading(false);
}
```

## 3. Safe Data Fetching in Components

When fetching data that depends on the user ID (like "My Comments"), always ensure the auth state is settled.

**✅ Best Practice:**
Gate your fetches behind the `!loading` check.

```typescript
useEffect(() => {
  if (!loading) {
    // Only fetch when we know for sure if user is logged in or not
    fetchData();
  }
}, [loading, ...dependencies]);
```

## Summary Checklist for New Projects

1.  [ ] Create a centralized `AuthContext.tsx`.
2.  [ ] Wrap your `App` (and `Router`) with `AuthProvider`.
3.  [ ] In `AuthContext`, use only `onAuthStateChange`.
4.  [ ] Never `await` non-critical data (profiles, avatars) inside the auth initialization storage.
5.  [ ] In components, use `if (!loading)` before making user-dependent API calls.
