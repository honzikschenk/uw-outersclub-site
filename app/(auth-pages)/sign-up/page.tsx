import { signUpAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { SmtpMessage } from "../smtp-message";

export default async function Signup(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  if ("message" in searchParams) {
    return (
      <div className="w-full flex-1 flex items-center h-screen sm:max-w-md justify-center gap-2 p-4">
        <FormMessage message={searchParams} />
      </div>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 w-full">
    <div className="container mx-auto flex flex-col w-full items-center justify-center min-h-[60vh] py-10 max-w-md">
      <form className="w-full flex flex-col">
        <h1 className="text-4xl font-bold mb-4">Sign up</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Already have an account?{" "}
          <Link className="text-primary font-medium underline" href="/sign-in">
            Sign in
          </Link>
        </p>
        <div className="flex flex-col gap-2 [&>input]:mb-3">
          <Label htmlFor="name">Name</Label>
          <Input
            name="name"
            type="text"
            placeholder="Your name"
            required
          />
          <Label htmlFor="email">Email</Label>
          <Input 
            name="email" 
            type="email"
            placeholder="you@uwaterloo.ca" 
            pattern=".*@uwaterloo\.ca$"
            title="Please use your UWaterloo email address (@uwaterloo.ca)"
            required 
          />
          <Label htmlFor="password">Password</Label>
          <Input
            type="password"
            name="password"
            placeholder="Your password"
            minLength={6}
            required
          />
          <SubmitButton formAction={signUpAction} pendingText="Signing up...">
            Sign up
          </SubmitButton>
          <FormMessage message={searchParams} />
        </div>
      </form>
      {/* <SmtpMessage /> */}
    </div>
    </main>
  );
}
