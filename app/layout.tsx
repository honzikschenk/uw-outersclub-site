import { EnvVarWarning } from "@/components/env-var-warning";
import HeaderAuth from "@/components/header-auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
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
import { Analytics } from "@vercel/analytics/next";
import { ShoppingCartProvider } from "@/contexts/ShoppingCartContext";
import { ShoppingCartSheet, MobileCartButton } from "@/components/ShoppingCart";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "UW Outers Club",
  description: "University of Waterloo Outers Club",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="font-sans" suppressHydrationWarning>
      <Analytics />
      <body className="bg-background text-foreground">
        <ShoppingCartProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            <main className="min-h-screen flex flex-col items-center">
              <div className="flex-1 w-full flex flex-col items-center">
                <header className="bg-background py-4">
                  <div className="container mx-auto flex items-center justify-between py-3">
                    <Link
                      href="/"
                      className="flex items-center gap-2 mr-10 max-lg:absolute max-lg:left-3"
                    >
                      <img
                        src="/logo.jpg"
                        alt="UW Outers Club Logo"
                        className="h-10 w-10 rounded-full"
                      />
                    </Link>

                    <nav className="hidden lg:flex items-center space-x-6">
                      <a href="/about" className="hover:text-primary">
                        About
                      </a>
                      <a href="/gear" className="hover:text-primary">
                        Gear Rental
                      </a>
                      <a href="/member" className="hover:text-primary">
                        My Rentals
                      </a>
                      <a href="/events" className="hover:text-primary">
                        Events/Trips
                      </a>
                      <a href="/gallery" className="hover:text-primary">
                        Gallery
                      </a>
                      <a href="/resources" className="hover:text-primary">
                        Resources
                      </a>
                      <a href="/blog" className="hover:text-primary">
                        Blog
                      </a>
                      <a href="/contact" className="hover:text-primary">
                        Contact
                      </a>
                      <ShoppingCartSheet />
                      {!hasEnvVars ? <EnvVarWarning /> : <HeaderAuth />}
                    </nav>

                    <div className="lg:hidden flex items-center gap-2 absolute right-16">
                      <ShoppingCartSheet />
                    </div>

                    <Sheet>
                      <SheetTrigger className={"lg:hidden absolute right-8"}>
                        <Menu />
                      </SheetTrigger>
                      <SheetContent className={"lg:hidden"}>
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
                            My Rentals
                          </a>
                          <a href="/events" className="hover:text-primary">
                            Events/Trips
                          </a>
                          <a href="/gallery" className="hover:text-primary">
                            Gallery
                          </a>
                          <a href="/resources" className="hover:text-primary">
                            Resources
                          </a>
                          <a href="/blog" className="hover:text-primary">
                            Blog
                          </a>
                          <a href="/contact" className="hover:text-primary">
                            Contact
                          </a>
                          <div className="pt-2 border-t">
                            <ShoppingCartSheet />
                          </div>
                          {!hasEnvVars ? <EnvVarWarning /> : <HeaderAuth />}
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                </header>
                <div className="flex flex-col w-full min-h-screen pb-20 lg:pb-0">{children}</div>
                <MobileCartButton />
                <footer className="w-full flex flex-col items-center justify-center border-t border-border bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 mx-auto text-center text-xs gap-2 py-8 shadow-inner">
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
        </ShoppingCartProvider>
      </body>
    </html>
  );
}
