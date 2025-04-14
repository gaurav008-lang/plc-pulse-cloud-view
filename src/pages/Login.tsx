
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { firebaseService } from '@/services/firebaseService';

const Login = () => {
  const [email, setEmail] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const ADMIN_EMAIL = "gauravthamke100@gmail.com";

  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Generate random 6-digit OTP
      const generatedOTP = generateOTP();
      
      // Store OTP in Firebase with email as key
      await firebaseService.saveOTP(email, generatedOTP);
      
      // In a real app, you would send the OTP via email service
      // For demonstration, we'll show it in a toast for the admin account
      if (email === ADMIN_EMAIL) {
        toast.info(`Your OTP is: ${generatedOTP}`);
      } else {
        toast.info("OTP sent to your email");
      }
      
      setIsOtpSent(true);
      setIsLoading(false);
    } catch (error) {
      toast.error("Failed to send OTP");
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const isValid = await firebaseService.verifyOTP(email, otp);
      
      if (isValid) {
        // Save login session
        localStorage.setItem('authUser', JSON.stringify({
          email,
          isAdmin: email === ADMIN_EMAIL,
          loginTime: new Date().toString()
        }));
        
        toast.success("Login successful");
        navigate("/");
      } else {
        toast.error("Invalid OTP");
      }
    } catch (error) {
      toast.error("Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg animate-fade-in">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-plc-blue">PLC Pulse Login</CardTitle>
          <CardDescription>
            {isOtpSent 
              ? "Enter the OTP sent to your email" 
              : "Enter your email to receive an OTP"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isOtpSent ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="your.email@example.com" 
                    className="pl-10" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                    Sending OTP
                  </>
                ) : "Send OTP"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">One-Time Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <Input 
                    id="otp" 
                    type="text" 
                    placeholder="123456" 
                    className="pl-10" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    required
                  />
                </div>
                <p className="text-sm text-gray-500">
                  We sent a 6-digit code to {email}
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
                    Verifying
                  </>
                ) : "Verify & Login"}
              </Button>
              
              <div className="text-center mt-4">
                <Button 
                  type="button" 
                  variant="link" 
                  onClick={() => setIsOtpSent(false)}
                  className="text-xs"
                >
                  Change email or resend OTP
                </Button>
              </div>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <p className="text-xs text-center text-gray-500">
            For support, contact your system administrator
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
