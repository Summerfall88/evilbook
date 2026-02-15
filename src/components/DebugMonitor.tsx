import { useState, useEffect } from "react";

const DebugMonitor = () => {
    const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
    const [scrollY, setScrollY] = useState(window.scrollY);
    const [layoutShifts, setLayoutShifts] = useState<{ sources: string[]; value: number }[]>([]);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);

        const handleResize = () => {
            setViewportHeight(window.innerHeight);
        };

        const handleScroll = () => {
            setScrollY(window.scrollY);
        };

        window.addEventListener("resize", handleResize);
        window.addEventListener("scroll", handleScroll);

        try {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.entryType === "layout-shift") {
                        const shift = entry as any;
                        if (shift.hadRecentInput) return;

                        const sources: string[] = [];
                        if (shift.sources) {
                            shift.sources.forEach((s: any) => {
                                if (s.node) {
                                    const name = s.node.nodeName.toLowerCase();
                                    const id = s.node.id ? `#${s.node.id}` : "";
                                    const classes = s.node.className ? `.${s.node.className.split(" ").join(".")}` : "";
                                    sources.push(`${name}${id}${classes}`);
                                }
                            });
                        }

                        setLayoutShifts((prev) => [{ sources, value: shift.value }, ...prev].slice(0, 5));
                    }
                }
            });

            observer.observe({ type: "layout-shift", buffered: true });
            return () => observer.disconnect();
        } catch (e) {
            console.warn("PerformanceObserver not supported for layout-shift");
        }

        return () => {
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-[9999] pointer-events-none">
            <div className="bg-black/80 text-white p-3 rounded-lg text-[10px] font-mono shadow-2xl border border-white/20 backdrop-blur-md space-y-2 max-h-48 overflow-y-auto pointer-events-auto">
                <div className="flex justify-between items-center border-b border-white/10 pb-1 mb-1">
                    <span className="text-gold font-bold">iOS DEBUGGER</span>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="text-white/40 hover:text-white"
                    >
                        [close]
                    </button>
                </div>

                <div className="flex flex-col gap-1">
                    <div className="flex justify-between gap-4">
                        <span className="text-gray-400">H:</span>{" "}
                        <span className={viewportHeight % 1 !== 0 ? "text-red-400" : "text-green-400"}>
                            {viewportHeight.toFixed(0)}px
                        </span>
                        <span className="text-gray-400">Y:</span>{" "}
                        <span className="text-blue-400">
                            {Math.round(scrollY)}
                        </span>
                    </div>
                </div>

                <div>
                    <div className="text-gray-400 mb-1 border-t border-white/10 pt-1 mt-1">Recent Shifts:</div>
                    {layoutShifts.length === 0 ? (
                        <div className="text-white/20 italic">No shifts detected yet...</div>
                    ) : (
                        <div className="space-y-1">
                            {layoutShifts.map((shift, i) => (
                                <div key={i} className="bg-white/5 p-1 rounded border-l-2 border-red-500">
                                    <div className="flex justify-between">
                                        <span className="text-red-400">Score: {shift.value.toFixed(4)}</span>
                                    </div>
                                    <div className="text-gray-300 truncate text-[8px]">
                                        {shift.sources.join(", ") || "Unknown source"}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DebugMonitor;
