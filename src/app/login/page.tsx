"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";
import { Loader2 } from "lucide-react";

const schema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
  token: z.string().min(1, "Token is required"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setCustomerId = useAuthStore((s) => s.setCustomerId);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { customerId: "", token: "" },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const res = await apiClient.post<{
        accessToken: string;
        refreshToken: string;
        expiresAt: number;
      }>("/api/auth/login", {
        customerId: data.customerId,
        token: data.token,
      });
      const expiresAt = res.data.expiresAt ?? Date.now() + 3600 * 1000;
      setTokens(res.data.accessToken, res.data.refreshToken, expiresAt, data.customerId);
      setCustomerId(data.customerId);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("ecom_customer_id", data.customerId);
      }
      toast({
        title: "Signed in",
        description: "Redirecting to dashboard.",
        variant: "success",
      });
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : "Invalid credentials";
      toast({
        title: "Sign in failed",
        description: String(message),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Enter your customer ID and token to access the dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerId">Customer ID</Label>
              <Input
                id="customerId"
                placeholder="e.g. CUST-001"
                autoComplete="username"
                {...register("customerId")}
                aria-invalid={!!errors.customerId}
                aria-describedby={errors.customerId ? "customerId-error" : undefined}
              />
              {errors.customerId && (
                <p id="customerId-error" className="text-sm text-destructive" role="alert">
                  {errors.customerId.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="token">Token</Label>
              <Input
                id="token"
                type="password"
                placeholder="Your token"
                autoComplete="current-password"
                {...register("token")}
                aria-invalid={!!errors.token}
                aria-describedby={errors.token ? "token-error" : undefined}
              />
              {errors.token && (
                <p id="token-error" className="text-sm text-destructive" role="alert">
                  {errors.token.message}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
