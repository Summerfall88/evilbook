import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const DebugMonitor = () => {
    const { pathname } = useLocation();
    const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
    const [scrollY, setScrollY] = useState(window.scrollY);
    const [isTouching, setIsTouching] = useState(false);
    const [events, setEvents] = useState<{ msg: string; time: string }[]>([]);
    const [lastJump, setLastJump] = useState<string | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);

        const handleResize = () => setViewportHeight(window.innerHeight);
        const handleScroll = () => {
            const currentY = window.scrollY;
            setScrollY(currentY);
        };

        const handleTouchStart = () => setIsTouching(true);
        const handleTouchEnd = () => setIsTouching(false);

        window.addEventListener("resize", handleResize);
        window.addEventListener("scroll", handleScroll);
        window.addEventListener("touchstart", handleTouchStart);
        window.addEventListener("touchend", handleTouchEnd);

        return () => {
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("touchstart", handleTouchStart);
            window.removeEventListener("touchend", handleTouchEnd);
        };
    }, []);

    // Detection logic in a separate effect to avoid stale closures
    useEffect(() => {
        if (scrollY === 0 && !isTouching) {
            // Potentially a programmatic jump if we were scrolled down
            // Note: we can't easily know the *previous* Y here without another ref/state
        }
    }, [scrollY, isTouching]);

    // Handle path changes event log
    useEffect(() => {
        const time = new Date().toLocaleTimeString().split(" ")[0];
        setEvents(prev => [{ msg: `NAV: ${pathname}`, time }, ...prev].slice(0, 5));
    }, [pathname]);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-[9999] pointer-events-none">
            <div className="bg-black/90 text-white p-3 rounded-lg text-[10px] font-mono shadow-2xl border border-white/20 backdrop-blur-md space-y-2 pointer-events-auto">
                <div className="flex justify-between items-center border-b border-white/10 pb-1">
                    <span className="text-gold font-bold">iOS ADVANCED DEBUG</span>
                    <button onClick={() => setIsVisible(false)} className="text-white/40">[x]</button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="flex justify-between border-r border-white/10 pr-2">
                        <span className="text-gray-400">H:</span>
                        <span className={viewportHeight % 1 !== 0 ? "text-red-400" : "text-green-400"}>{viewportHeight.toFixed(0)}px</span>
                    </div>
                    <div className="flex justify-between px-1">
                        <span className="text-gray-400">Y:</span>
                        <span className="text-blue-400">{Math.round(scrollY)}px</span>
                    </div>
                    <div className="flex justify-between border-r border-white/10 pr-2">
                        <span className="text-gray-400">TOUCH:</span>
                        <span className={isTouching ? "text-green-400" : "text-red-400"}>{isTouching ? "YES" : "NO"}</span>
                    </div>
                    <div className="flex justify-between px-1">
                        <span className="text-gray-400">PATH:</span>
                        <span className="text-purple-400 truncate ml-1 text-[8px]">{pathname}</span>
                    </div>
                </div>

                <div className="space-y-1">
                    <div className="text-gray-400 text-[8px] uppercase">Event Log:</div>
                    {events.map((ev, i) => (
                        <div key={i} className="flex gap-2 text-[8px] border-l border-white/20 pl-1">
                            <span className="text-white/40">{ev.time}</span>
                            <span className="truncate">{ev.msg}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DebugMonitor;
