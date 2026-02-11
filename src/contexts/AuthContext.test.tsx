import { render, screen, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";

// Mock Supabase client
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockFrom = vi.fn();
const mockSignOut = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
    supabase: {
        auth: {
            getSession: (...args: any[]) => mockGetSession(...args),
            onAuthStateChange: (...args: any[]) => mockOnAuthStateChange(...args),
            signOut: (...args: any[]) => mockSignOut(...args),
        },
        from: (...args: any[]) => mockFrom(...args),
    },
}));

// Test component consuming the context
const TestConsumer = () => {
    const { user, loading, displayName } = useAuth();
    if (loading) return <div>Loading...</div>;
    return (
        <div>
            <div data-testid="user">{user ? user.email : "No User"}</div>
            <div data-testid="display-name">{displayName || "No Name"}</div>
        </div>
    );
};

describe("AuthProvider", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Default mocks behavior
        mockGetSession.mockResolvedValue({
            data: { session: null },
            error: null,
        });

        mockOnAuthStateChange.mockReturnValue({
            data: { subscription: { unsubscribe: vi.fn() } },
        });

        mockFrom.mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({ data: { display_name: "Test User" } }),
                }),
            }),
        });
    });

    it("initializes with loading state and checks session", async () => {
        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );

        // Should start with loading
        expect(screen.getByText("Loading...")).toBeInTheDocument();

        // Should call onAuthStateChange
        expect(mockOnAuthStateChange).toHaveBeenCalledTimes(1);

        // After loading, should show No User (since default mock is null)
        await waitFor(() => {
            expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
        });
        expect(screen.getByTestId("user")).toHaveTextContent("No User");
    });

    it("restores user session from onAuthStateChange (initial session)", async () => {
        const mockUser = { id: "123", email: "test@example.com" };

        // Setup onAuthStateChange 
        mockOnAuthStateChange.mockImplementation((cb) => {
            // Simulate immediate callback with session
            cb("INITIAL_SESSION", { user: mockUser });
            return {
                data: { subscription: { unsubscribe: vi.fn() } },
            };
        });

        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId("user")).toHaveTextContent("test@example.com");
        });

        // Should also fetch profile
        expect(mockFrom).toHaveBeenCalledWith("profiles");
    });

    it("updates state on auth change event", async () => {
        // Start with no user
        let authCallback: any;
        mockOnAuthStateChange.mockImplementation((cb) => {
            authCallback = cb;
            return {
                data: { subscription: { unsubscribe: vi.fn() } },
            };
        });

        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId("user")).toHaveTextContent("No User");
        });

        // Simulate login event
        const mockUser = { id: "456", email: "login@example.com" };

        await act(async () => {
            if (authCallback) {
                await authCallback("SIGNED_IN", { user: mockUser });
            }
        });

        expect(screen.getByTestId("user")).toHaveTextContent("login@example.com");
    });
});
