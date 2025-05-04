import { EnvVarWarning } from "@/components/env-var-warning";
import HeaderAuth from "@/components/header-auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import "./globals.css";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
  NavigationMenuContent,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "UW Outers Club",
  description: "University of Waterloo Outers Club",
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <main className="min-h-screen flex flex-col items-center">
            <div className="flex-1 w-full flex flex-col items-center">
              <header className="bg-background py-4">
                <div className="container mx-auto flex items-center justify-between">
                  <Link
                    href="/"
                    className="flex items-center gap-2 mr-10 max-md:absolute max-md:left-3"
                  >
                    <img
                      src="/logo.jpg"
                      alt="UW Outers Club Logo"
                      className="h-10 w-10 rounded-full"
                    />
                  </Link>

                  <nav className="hidden md:flex items-center space-x-6">
                    <a href="/about" className="hover:text-primary">
                      About
                    </a>
                    <a href="/gear" className="hover:text-primary">
                      Gear Rental
                    </a>
                    <a href="/member" className="hober:text-primary">
                      Members
                    </a>
                    <a href="/events" className="hover:text-primary">
                      Events/Trips
                    </a>
                    <a href="/resources" className="hover:text-primary">
                      Resources
                    </a>
                    <a href="/contact" className="hover:text-primary">
                      Contact
                    </a>
                    {!hasEnvVars ? <EnvVarWarning /> : <HeaderAuth />}
                  </nav>
                  <Sheet>
                    <SheetTrigger className={"md:hidden ml-auto"}>
                      <Menu />
                    </SheetTrigger>
                    <SheetContent className={"md:hidden"}>
                      <a href="/">
                        <SheetHeader className="mb-10">
                          <SheetTitle>
                            <img
                              src="/logo.jpg"
                              alt="UW Outers Club Logo"
                              className="h-10 w-10 rounded-full"
                            />
                            UW OutersClub
                          </SheetTitle>
                          {/* <SheetDescription>
                          Explore the outdoors with us!
                        </SheetDescription> */}
                        </SheetHeader>
                      </a>
                      <div className={"grid gap-4"}>
                        <a href="/about" className="hover:text-primary">
                          About
                        </a>
                        <a href="/gear" className="hover:text-primary">
                          Gear Rental
                        </a>
                        <a href="/member" className="hover:text-primary">
                          Members
                        </a>
                        <a href="/events" className="hover:text-primary">
                          Events/Trips
                        </a>
                        <a href="/resources" className="hover:text-primary">
                          Resources
                        </a>
                        <a href="/contact" className="hover:text-primary">
                          Contact
                        </a>
                        {!hasEnvVars ? <EnvVarWarning /> : <HeaderAuth />}
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </header>
              <div className="flex flex-col w-full">{children}</div>
              <footer className="w-full flex flex-col items-center justify-center border-t border-border bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 mx-auto text-center text-xs gap-2 py-8 mt-10 shadow-inner">
                <div className="flex items-center gap-2">
                  <img
                    src="/logo.jpg"
                    alt="UW Outers Club Logo"
                    className="h-7 w-7 rounded-full"
                  />
                  <span className="text-foreground font-medium">
                    UW Outers Club &copy; {new Date().getFullYear()}
                  </span>
                </div>
              </footer>
            </div>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
