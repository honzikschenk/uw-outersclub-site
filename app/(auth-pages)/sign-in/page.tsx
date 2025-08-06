import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;
  return (
    <main className="max-w-3xl mx-auto px-4 w-full">
    <div className="container mx-auto flex flex-col w-full items-center justify-center min-h-[60vh] py-10 max-w-md">
      <form className="w-full flex flex-col">
        <h1 className="text-4xl font-bold mb-4">Sign in</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Don't have an account?{" "}
          <Link className="text-primary font-medium underline" href="/sign-up">
            Sign up
          </Link>
        </p>
        <div className="flex flex-col gap-2 [&>input]:mb-3">
          <Label htmlFor="email">Email</Label>
          <Input name="email" placeholder="you@waterloo.ca" required />
          <div className="flex justify-between items-center">
            <Label htmlFor="password">Password</Label>
            {/* <Link
              className="text-xs text-primary underline"
              href="/forgot-password"
            >
              Forgot Password?
            </Link> */}
          </div>
          <Input
            type="password"
            name="password"
            placeholder="Your password"
            required
          />
          <SubmitButton pendingText="Signing In..." formAction={signInAction}>
            Sign in
          </SubmitButton>
          <FormMessage message={searchParams} />
        </div>
      </form>
    </div>
    </main>
  );
}
