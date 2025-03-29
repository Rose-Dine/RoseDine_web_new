"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format, addDays, subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApiClient } from "@/lib/api-client";
import { MenuItems } from "@/components/menu-items";
import { DateSelector } from "@/components/date-selector";
import { MealTypeSelector } from "@/components/meal-type-selector";
import { Loader2, UserCircle2, Mail } from "lucide-react";
import Link from "next/link";
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

// Import MenuItem interface from the MenuItems component
import type { MenuItem } from "@/components/menu-items";

interface Recommendation {
  item: MenuItem;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  totalCalories: number;
}

interface RecommendationTotalsProps {
  totals: {
    totalProtein: number;
    totalCarbs: number;
    totalFats: number;
    totalCalories: number;
  };
}

function RecommendationTotals({ totals }: RecommendationTotalsProps) {
  return (
    <Card className="p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4">Recommended Meal Totals</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Protein</p>
          <p className="text-lg font-medium">{totals.totalProtein}g</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Carbs</p>
          <p className="text-lg font-medium">{totals.totalCarbs}g</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Fats</p>
          <p className="text-lg font-medium">{totals.totalFats}g</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Calories</p>
          <p className="text-lg font-medium">{totals.totalCalories}</p>
        </div>
      </div>
    </Card>
  );
}

export default function SchedulePage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMealType, setSelectedMealType] = useState("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [cafeteriaStatus, setCafeteriaStatus] = useState({ isOpen: false, hours: "" });

  const getMealHours = (mealType: string, isWeekend: boolean) => {
    switch (mealType) {
      case 'Breakfast':
        return '7:00 AM - 10:00 AM';
      case 'Brunch':
        return '10:00 AM - 2:00 PM';
      case 'Lunch':
        return '11:00 AM - 2:00 PM';
      case 'Dinner':
        return isWeekend ? '5:00 PM - 7:00 PM' : '5:00 PM - 8:00 PM';
      default:
        return '';
    }
  };

  const checkCafeteriaStatus = () => {
    const now = new Date();
    const estTime = utcToZonedTime(now, 'America/New_York');
    const currentHour = estTime.getHours();
    const currentMinutes = estTime.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinutes;
    const isWeekend = estTime.getDay() === 0 || estTime.getDay() === 6;

    let isOpen = false;
    let hours = '';

    if (isWeekend) {
      // Brunch: 10:00 AM - 2:00 PM
      if (currentTimeInMinutes >= 600 && currentTimeInMinutes < 840) {
        isOpen = true;
        hours = '10:00 AM - 2:00 PM';
      }
      // Dinner (Sunday only): 5:00 PM - 7:00 PM
      else if (estTime.getDay() === 0 && currentTimeInMinutes >= 1020 && currentTimeInMinutes < 1140) {
        isOpen = true;
        hours = '5:00 PM - 7:00 PM';
      }
    } else {
      // Breakfast: 7:00 AM - 10:00 AM
      if (currentTimeInMinutes >= 420 && currentTimeInMinutes < 600) {
        isOpen = true;
        hours = '7:00 AM - 10:00 AM';
      }
      // Lunch: 11:00 AM - 2:00 PM
      else if (currentTimeInMinutes >= 660 && currentTimeInMinutes < 840) {
        isOpen = true;
        hours = '11:00 AM - 2:00 PM';
      }
      // Dinner: 5:00 PM - 8:00 PM
      else if (currentTimeInMinutes >= 1020 && currentTimeInMinutes < 1200) {
        isOpen = true;
        hours = '5:00 PM - 8:00 PM';
      }
    }

    setCafeteriaStatus({ isOpen, hours });
  };

  useEffect(() => {
    checkCafeteriaStatus();
    const interval = setInterval(checkCafeteriaStatus, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const handleEmailClick = () => {
    window.location.href = 'mailto:support@bonappetit.com?subject=Feedback';
  };

  useEffect(() => {
    // Check both localStorage and sessionStorage for user data
    const localUserData = localStorage.getItem("userData");
    const sessionUserData = sessionStorage.getItem("userData");
    const userData = localUserData || sessionUserData;
    
    if (!userData) {
      router.push("/login");
      return;
    }
    
    // Check if login is still valid (24 hours)
    const { loginTime } = JSON.parse(userData);
    const loginDate = new Date(loginTime);
    const now = new Date();
    if (now.getTime() - loginDate.getTime() > 24 * 60 * 60 * 1000) {
      localStorage.removeItem("userData");
      router.push("/login");
      return;
    }

    const initializeMealType = () => {
      const now = new Date();
      const hour = now.getHours();
      const isWeekend = now.getDay() === 0;
      const isSaturday = now.getDay() === 6;

      if (isWeekend || isSaturday) {
        return "Brunch";
      } else if (hour < 11) {
        return "Breakfast";
      } else if (hour < 17) {
        return "Lunch";
      } else {
        return "Dinner";
      }
    };

    if (!selectedMealType) {
      setSelectedMealType(initializeMealType());
    }
  }, [router, selectedMealType]);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedMealType) return;
      
      setIsLoading(true);
      setError("");

      // Check both localStorage and sessionStorage for user data
      const localUserData = localStorage.getItem("userData");
      const sessionUserData = sessionStorage.getItem("userData");
      const userData = localUserData || sessionUserData;
      
      if (!userData) return;
      const { id: userId } = JSON.parse(userData);

      try {
        // Fetch menu items
        const menuResponse = await ApiClient.getMenuItems(
          format(selectedDate, "yyyy-MM-dd"),
          selectedMealType
        );

        if (menuResponse.error) {
          setError(menuResponse.error);
          return;
        }

        setMenuItems(menuResponse.data || []);

        // Fetch recommendations
        const recommendationsResponse = await ApiClient.getRecommendations(
          userId,
          format(selectedDate, "yyyy-MM-dd"),
          selectedMealType
        );

        if (!recommendationsResponse.error && recommendationsResponse.data) {
          setRecommendations(recommendationsResponse.data);
        }
      } catch (err) {
        setError("Failed to fetch menu data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedDate, selectedMealType]);

  const recommendedItems = recommendations.map(rec => rec.item);
  const regularItems = menuItems.filter(item => 
    !recommendedItems.some(rec => rec.id === item.id)
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-stretch gap-4">
          <Card className="p-4 md:p-6 shadow-md flex-1">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
              <DateSelector
                selectedDate={selectedDate}
                onPrevious={() => setSelectedDate(subDays(selectedDate, 1))}
                onNext={() => setSelectedDate(addDays(selectedDate, 1))}
              />
              <div className="flex flex-col items-center gap-2">
                <div className={`text-sm ${cafeteriaStatus.isOpen ? 'text-green-500' : 'text-red-500'}`}>
                  Cafeteria is {cafeteriaStatus.isOpen ? 'Open' : 'Closed'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {getMealHours(selectedMealType, selectedDate.getDay() === 0 || selectedDate.getDay() === 6)}
                </div>
              </div>
              <MealTypeSelector
                selectedMealType={selectedMealType}
                onSelect={setSelectedMealType}
                selectedDate={selectedDate}
              />
            </div>
          </Card>
          <div className="flex gap-2 justify-center md:justify-start">
            <Button variant="outline" size="icon" className="h-14 w-14" onClick={handleEmailClick}>
              <Mail className="h-6 w-6" />
            </Button>
            <Link href="/profile">
              <Button variant="outline" size="icon" className="h-14 w-14">
                <UserCircle2 className="h-6 w-6" />
              </Button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Card className="p-4">
            <p className="text-destructive text-center">{error}</p>
          </Card>
        ) : (
          <div className="space-y-8">
            {recommendations.length > 0 && (
              <>
                <RecommendationTotals 
                  totals={{
                    totalProtein: recommendations[0].totalProtein,
                    totalCarbs: recommendations[0].totalCarbs,
                    totalFats: recommendations[0].totalFats,
                    totalCalories: recommendations[0].totalCalories,
                  }} 
                />
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold">Recommended Items</h2>
                  <MenuItems items={recommendedItems} />
                </div>
                <hr className="border-primary/20" />
              </>
            )}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">All Items</h2>
              <MenuItems items={regularItems} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}