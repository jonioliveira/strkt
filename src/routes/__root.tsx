import { HeadContent, Scripts, createRootRouteWithContext, Link, Outlet } from "@tanstack/react-router"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useSession, signOut } from "#/lib/auth-client"
import { Button } from "#/components/ui/button"
import { Footer } from "#/components/Footer"
import { LogOut, LayoutDashboard, Zap } from "lucide-react"

import appCss from "../styles.css?url"

function NotFound() {
  return (
    <div className="page-wrap py-32 text-center">
      <p className="font-display font-black text-8xl text-[#2a2a30] mb-4">404</p>
      <p className="text-[#7a7a88] mb-6">Página não encontrada.</p>
      <a href="/" className="text-sm text-[#C8FF47] hover:underline">← Voltar ao início</a>
    </div>
  )
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  notFoundComponent: NotFound,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "STRKT — Athlete Exposure Platform" },
      { name: "description", content: "Iberian athlete media exposure platform. Real-time ROI for sponsors." },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootLayout,
})

function RootLayout() {
  const { queryClient } = Route.useRouteContext()

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        <QueryClientProvider client={queryClient}>
          <NavBar />
          <Outlet />
          <Footer />
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  )
}

function NavBar() {
  const { data: session } = useSession()

  const role = (session?.user as any)?.role
  const dashboardHref =
    role === "sponsor" ? "/dashboard/sponsor" :
    role === "admin" ? "/dashboard/admin" :
    "/dashboard/athlete"

  return (
    <header className="sticky top-0 z-50 border-b border-[#2a2a30] bg-[#080809]/90 backdrop-blur-md">
      <div className="page-wrap flex h-14 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 no-underline">
          <Zap className="w-5 h-5 text-[#C8FF47]" />
          <span className="font-display font-black text-xl text-[#F0F0F2] tracking-tight">
            STRKT
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link
            to="/athletes"
            className="text-sm text-[#7a7a88] hover:text-[#F0F0F2] transition-colors no-underline [&.active]:text-[#C8FF47]"
          >
            Marketplace
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {session ? (
            <>
              <Link to={dashboardHref} className="no-underline">
                <Button variant="secondary" size="sm" className="gap-1.5">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Dashboard
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut()}
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth/login" className="no-underline">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link to="/auth/register" className="no-underline">
                <Button size="sm">Join</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
