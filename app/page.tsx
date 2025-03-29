import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-6">
        <div className="flex justify-center mb-4">
          <img 
            src="/logo.jpg" 
            alt="RoseDine Logo" 
            className="h-54 w-auto rounded-full object-cover shadow-md" 
          />
        </div>
        <h1 className="text-3xl font-bold text-center text-foreground">Welcome to RoseDine</h1>
        <p className="text-center text-muted-foreground">
          Your personalized dining experience at Rose-Hulman
        </p>
        <div className="space-y-4">
          <Link href="/login" className="w-full">
            <Button className="w-full h-12 text-base" variant="default">
              Login
            </Button>
          </Link>
          <Link href="/signup" className="w-full">
            <Button className="w-full h-12 text-base" variant="outline">
              Create Account
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

