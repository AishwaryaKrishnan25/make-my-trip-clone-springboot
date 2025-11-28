import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { DialogDescription } from "@radix-ui/react-dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { signup, login } from "../api";
import { setUser } from "@/store";
import { useDispatch } from "react-redux";

const SignupDialog = ({ trigger }: any) => {
  const dispatch = useDispatch();

  const [open, setOpen] = useState(false);
  const [isSignup, setIsSignup] = useState(true);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setPhoneNumber("");
    setEmail("");
    setPassword("");
    setError(null);
  };

  const handleSignup = async () => {
    try {
      setLoading(true);
      setError(null);
      await signup(firstName, lastName, email, phoneNumber, password);
      // after signup, switch to login mode
      setIsSignup(false);
    } catch (e: any) {
      setError(e?.response?.data?.error || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await login(email, password);
      // backend: { token, user }
      if (typeof window !== "undefined" && data?.token) {
        localStorage.setItem("token", data.token);
      }
      if (data?.user) {
        dispatch(setUser(data.user));
      }
      setOpen(false);
      resetForm();
    } catch (e: any) {
      setError(e?.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignup) {
      handleSignup();
    } else {
      handleLogin();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {isSignup ? "Create Account" : "Welcome Back"}
          </DialogTitle>
          <DialogDescription>
            {isSignup
              ? "Join us to start booking your perfect trips."
              : "Log in to continue where you left off."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {isSignup && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-blue-600 text-white"
          >
            {loading
              ? "Please wait..."
              : isSignup
              ? "Sign Up"
              : "Login"}
          </Button>
        </form>

        <div className="mt-4 text-sm text-center">
          {isSignup ? (
            <>
              Already have an account?{" "}
              <Button
                type="button"
                variant="link"
                className="p-0 text-blue-600"
                onClick={() => setIsSignup(false)}
              >
                Login
              </Button>
            </>
          ) : (
            <>
              New here?{" "}
              <Button
                type="button"
                variant="link"
                className="p-0 text-blue-600"
                onClick={() => setIsSignup(true)}
              >
                Sign Up
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignupDialog;
