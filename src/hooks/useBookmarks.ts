import { useState, useEffect } from "react";

const BOOKMARKS_KEY = "evilbook-bookmarks";

export const useBookmarks = () => {
    const [bookmarks, setBookmarks] = useState<string[]>([]);

    useEffect(() => {
        const loadBookmarks = () => {
            try {
                const stored = localStorage.getItem(BOOKMARKS_KEY);
                if (stored) {
                    setBookmarks(JSON.parse(stored));
                }
            } catch (error) {
                console.error("Failed to load bookmarks", error);
            }
        };

        loadBookmarks();

        // Listen for cross-tab or cross-component bookmark updates
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === BOOKMARKS_KEY) {
                loadBookmarks();
            }
        };

        // Custom event for same-tab updates
        const handleLocalUpdate = () => {
            loadBookmarks();
        };

        window.addEventListener("storage", handleStorageChange);
        window.addEventListener("evilbook-bookmarks-updated", handleLocalUpdate);

        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("evilbook-bookmarks-updated", handleLocalUpdate);
        };
    }, []);

    const toggleBookmark = (reviewId: string) => {
        try {
            const stored = localStorage.getItem(BOOKMARKS_KEY);
            let currentBookmarks: string[] = stored ? JSON.parse(stored) : [];

            if (currentBookmarks.includes(reviewId)) {
                currentBookmarks = currentBookmarks.filter((id) => id !== reviewId);
            } else {
                currentBookmarks.push(reviewId);
            }

            localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(currentBookmarks));
            setBookmarks(currentBookmarks);

            // Dispatch event to update other components in the same tab
            window.dispatchEvent(new Event("evilbook-bookmarks-updated"));
        } catch (error) {
            console.error("Failed to toggle bookmark", error);
        }
    };

    const isBookmarked = (reviewId: string) => {
        return bookmarks.includes(reviewId);
    };

    return { bookmarks, toggleBookmark, isBookmarked };
};
