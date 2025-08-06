"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { supabaseService } from "@/utils/supabase/service";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const signUpAction = async (formData: FormData) => {
  const name = formData.get("name")?.toString();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!name || !email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Name, email and password are required"
    );
  }

  // Validate UWaterloo email domain
  if (!email.endsWith("@uwaterloo.ca")) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Please use your UWaterloo email address (@uwaterloo.ca)"
    );
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error(error.code + " " + error.message);
    return encodedRedirect("error", "/sign-up", error.message);
  } else {
    // Create Membership entry using service role client to bypass RLS
    if (data.user) {
      const { error: membershipError } = await supabaseService
        .from("Membership")
        .insert({
          user_id: data.user.id,
          name: name,
          joined_on: new Date().toISOString(),
          valid: false,
          admin: false,
        });

      if (membershipError) {
        console.error("Failed to create membership:", membershipError);
        // Don't return error here as user was created successfully
        // Admin can manually create membership if needed
      }
    }

    // If sign-up is successful, attempt to sign the user in immediately
    // This works if email confirmation is disabled in Supabase settings
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      // If sign-in fails due to email confirmation requirement,
      // show a message but don't treat it as an error
      if (signInError.message?.includes('email') || signInError.message?.includes('confirm')) {
        return encodedRedirect(
          "success",
          "/sign-up",
          "Account created successfully! You can now sign in."
        );
      }
      console.error(signInError.code + " " + signInError.message);
      return encodedRedirect("error", "/sign-up", signInError.message);
    }

    // If sign-in is successful, redirect to member page
    return redirect("/member");
  }
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect("/member");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password"
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password."
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required"
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Passwords do not match"
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password update failed"
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};
