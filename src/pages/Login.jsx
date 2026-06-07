import React from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import GoogleIcon from "@/components/GoogleIcon";

export default function Login() {
  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", "/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <img
            src="https://media.base44.com/images/public/69b4780e4278ece8feeae352/e21e4f4e1_pip-events.png"
            alt="PIP Events"
            className="w-20 h-20 rounded-2xl object-cover mx-auto mb-4 shadow-sm"
          />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h1>
          <p className="text-muted-foreground mt-2">Log in to your account</p>
        </div>
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
          <Button
            variant="outline"
            className="w-full h-12 text-sm font-medium"
            onClick={handleGoogle}
          >
            <GoogleIcon className="w-5 h-5 mr-2" />
            Continue with Google
          </Button>
        </div>
      </div>
    </div>
  );
}