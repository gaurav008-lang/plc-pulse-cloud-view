
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, User, Loader2, KeyRound } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { generateOTP, emailService } from '@/services/emailService';
import { firebaseService } from '@/services/firebaseService';
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const ADMIN_EMAIL = "gauravthamke100@gmail.com";

const loginSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
});

const otpSchema = z.object({
  otp: z.string().length(6, { message: "OTP must be 6 digits." })
});

const Login = () => {
  const [step, setStep] = useState<"details" | "otp">("details");
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [generatedOTP, setGeneratedOTP] = useState("");
  const navigate = useNavigate();

  const detailsForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  const handleRequestAccess = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    
    try {
      const otp = generateOTP();
      setGeneratedOTP(otp);
      setUserName(values.name);
      setUserEmail(values.email);
      
      // Store OTP in Firebase with email as key
      await firebaseService.saveOTP(values.email, otp);
      
      // Send OTP to admin via EmailJS
      const emailResult = await emailService.sendOTPToAdmin({
        userName: values.name,
        userEmail: values.email,
        otp: otp,
        adminEmail: ADMIN_EMAIL
      });
      
      if (emailResult) {
        toast.success("Access request sent to administrator");
        setStep("otp");
      } else {
        toast.error("Failed to send access request. Please try again.");
      }
      
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to generate OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (values: z.infer<typeof otpSchema>) => {
    setIsLoading(true);
    
    try {
      const isValid = await firebaseService.verifyOTP(userEmail, values.otp);
      
      if (isValid) {
        // Save login session
        localStorage.setItem('authUser', JSON.stringify({
          email: userEmail,
          name: userName,
          isAdmin: userEmail === ADMIN_EMAIL,
          loginTime: new Date().toString()
        }));
        
        toast.success("Login successful! Welcome to PLC Pulse");
        navigate("/");
      } else {
        toast.error("Invalid OTP. Please check with the administrator.");
      }
    } catch (error) {
      toast.error("Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 p-4">
      <Card className="w-full max-w-md shadow-xl animate-fade-in">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-primary">PLC Pulse Access System</CardTitle>
          <CardDescription>
            {step === "details" 
              ? "Enter your details to request access" 
              : "Enter the OTP provided by the administrator"}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {step === "details" ? (
            <Form {...detailsForm}>
              <form onSubmit={detailsForm.handleSubmit(handleRequestAccess)} className="space-y-4">
                <FormField
                  control={detailsForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <FormControl>
                          <Input 
                            placeholder="Your full name" 
                            className="pl-10" 
                            {...field} 
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={detailsForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="you@example.com" 
                            className="pl-10" 
                            {...field} 
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                      Requesting Access...
                    </>
                  ) : "Request Access"}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...otpForm}>
              <form onSubmit={otpForm.handleSubmit(handleVerifyOTP)} className="space-y-4">
                <FormField
                  control={otpForm.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>One-Time Password</FormLabel>
                      <FormControl>
                        <InputOTP maxLength={6} {...field}>
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-md border border-blue-100 mb-4">
                  <p className="flex items-center">
                    <KeyRound className="h-4 w-4 mr-2 text-blue-500" />
                    Check with administrator {ADMIN_EMAIL} for your OTP
                  </p>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                      Verifying...
                    </>
                  ) : "Verify & Login"}
                </Button>
                
                <div className="text-center mt-4">
                  <Button 
                    type="button" 
                    variant="ghost"
                    onClick={() => setStep("details")}
                    className="text-xs"
                  >
                    Back to request form
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center border-t pt-4">
          <p className="text-xs text-center text-gray-500">
            For support, contact system administrator at {ADMIN_EMAIL}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
