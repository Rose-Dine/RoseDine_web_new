"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ApiClient } from "@/lib/api-client";
import { Loader2, LogOut, ArrowLeft } from "lucide-react";

interface MacroInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  isLoading?: boolean;
}

function MacroInput({ label, value, onChange, isLoading }: MacroInputProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-24"
          disabled={isLoading}
        />
        <span className="text-sm text-muted-foreground">g</span>
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>
    </div>
  );
}

interface MealPreferencesProps {
  mealType: string;
  preferences: {
    protein: number;
    carbs: number;
    fat: number;
    calories: number;
  };
  onUpdate: (type: string, value: number) => void;
  isLoading: boolean;
}

function MealPreferences({ mealType, preferences, onUpdate, isLoading }: MealPreferencesProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">{mealType}</h3>
      <div className="grid grid-cols-2 gap-6">
        <MacroInput
          label="Protein"
          value={preferences.protein}
          onChange={(value) => onUpdate("Protein", value)}
          isLoading={isLoading}
        />
        <MacroInput
          label="Carbohydrates"
          value={preferences.carbs}
          onChange={(value) => onUpdate("Carbohydrates", value)}
          isLoading={isLoading}
        />
        <MacroInput
          label="Fat"
          value={preferences.fat}
          onChange={(value) => onUpdate("Fat", value)}
          isLoading={isLoading}
        />
        <MacroInput
          label="Calories"
          value={preferences.calories}
          onChange={(value) => onUpdate("Calories", value)}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState<string>("");
  const [pendingMacros, setPendingMacros] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem("userData");
    if (!userData) {
      router.push("/login");
      return;
    }
    
    const { id: userId } = JSON.parse(userData);

    const fetchPreferences = async () => {
      try {
        const response = await ApiClient.getUserPreferences(userId);
        if (response.error) {
          console.error("Failed to fetch preferences:", response.error);
        } else {
          setPreferences(response.data);
        }
      } catch (error) {
        console.error("Error fetching preferences:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, [router]);

  useEffect(() => {
    if (preferences) {
      setPendingMacros(preferences);
    }
  }, [preferences]);

  const handleSignOut = () => {
    localStorage.removeItem("userData");
    router.push("/login");
  };

  const handleMacroChange = (mealType: string, macroName: string, value: number) => {
    setPendingMacros((prev: any) => ({
      ...prev,
      [`${mealType}${macroName}`]: value,
    }));
  };

  const handleSaveMacros = async () => {
    if (!pendingMacros) return;
    
    const userData = localStorage.getItem("userData");
    if (!userData) return;
    const { id: userId } = JSON.parse(userData);

    setUpdateLoading("saving");
    
    try {
      const mealTypes = ["Breakfast", "Lunch", "Dinner", "Brunch"];
      const macroTypes = ["Protein", "Carbohydrates", "Fat", "Calories"];
      
      for (const mealType of mealTypes) {
        for (const macroName of macroTypes) {
          const key = `${mealType}${macroName}`;
          if (pendingMacros[key] !== preferences[key]) {
            await ApiClient.updateMacro(userId, mealType, macroName, pendingMacros[key]);
          }
        }
      }
      
      setPreferences(pendingMacros);
    } catch (error) {
      console.error("Failed to update macros:", error);
    } finally {
      setUpdateLoading("");
    }
  };

  const handleDietaryUpdate = async (restriction: string, value: boolean) => {
    const userData = localStorage.getItem("userData");
    if (!userData) return;
    const { id: userId } = JSON.parse(userData);

    setUpdateLoading(restriction);
    try {
      await ApiClient.updateDietaryRestriction(userId, restriction, value);
      setPreferences((prev: any) => ({
        ...prev,
        [restriction]: value,
      }));
    } catch (error) {
      console.error("Failed to update dietary restriction:", error);
    } finally {
      setUpdateLoading("");
    }
  };

  const handleMacroUpdate = async (mealType: string, macroName: string, value: number) => {
    const userData = localStorage.getItem("userData");
    if (!userData) return;
    const { id: userId } = JSON.parse(userData);

    const loadingKey = `${mealType}-${macroName}`;
    setUpdateLoading(loadingKey);

    try {
      await ApiClient.updateMacro(userId, mealType, macroName, value);
      setPreferences((prev: any) => ({
        ...prev,
        [`${mealType}${macroName}`]: value,
      }));
    } catch (error) {
      console.error("Failed to update macro:", error);
    } finally {
      setUpdateLoading("");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()} className="hover:bg-primary/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <Button variant="outline" onClick={handleSignOut} className="ml-auto">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Dietary Restrictions</h2>
          <div className="space-y-4">
            {["IsVegan", "IsVegetarian", "IsGlutenFree"].map((restriction) => (
              <div key={restriction} className="flex items-center justify-between">
                <Label htmlFor={restriction} className="text-base">
                  {restriction.replace("Is", "")}
                </Label>
                <div className="flex items-center gap-2">
                  {updateLoading === restriction && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  <Switch
                    id={restriction}
                    checked={preferences[restriction]}
                    onCheckedChange={(checked) => handleDietaryUpdate(restriction, checked)}
                    disabled={updateLoading === restriction}
                    className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-primary/20"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Macro Preferences</h2>
          <Tabs defaultValue="breakfast" className="space-y-6">
            <TabsList>
              <TabsTrigger value="breakfast">Breakfast</TabsTrigger>
              <TabsTrigger value="lunch">Lunch</TabsTrigger>
              <TabsTrigger value="dinner">Dinner</TabsTrigger>
              <TabsTrigger value="brunch">Brunch</TabsTrigger>
            </TabsList>

            <TabsContent value="breakfast">
              <MealPreferences
                mealType="Breakfast"
                preferences={{
                  protein: pendingMacros?.BreakfastProtein ?? preferences.BreakfastProtein,
                  carbs: pendingMacros?.BreakfastCarbohydrates ?? preferences.BreakfastCarbohydrates,
                  fat: pendingMacros?.BreakfastFat ?? preferences.BreakfastFat,
                  calories: pendingMacros?.BreakfastCalories ?? preferences.BreakfastCalories,
                }}
                onUpdate={(macro, value) => handleMacroChange("Breakfast", macro, value)}
                isLoading={updateLoading.startsWith("Breakfast")}
              />
            </TabsContent>

            <TabsContent value="lunch">
              <MealPreferences
                mealType="Lunch"
                preferences={{
                  protein: pendingMacros?.LunchProtein ?? preferences.LunchProtein,
                  carbs: pendingMacros?.LunchCarbohydrates ?? preferences.LunchCarbohydrates,
                  fat: pendingMacros?.LunchFat ?? preferences.LunchFat,
                  calories: pendingMacros?.LunchCalories ?? preferences.LunchCalories,
                }}
                onUpdate={(macro, value) => handleMacroChange("Lunch", macro, value)}
                isLoading={updateLoading.startsWith("Lunch")}
              />
            </TabsContent>

            <TabsContent value="dinner">
              <MealPreferences
                mealType="Dinner"
                preferences={{
                  protein: pendingMacros?.DinnerProtein ?? preferences.DinnerProtein,
                  carbs: pendingMacros?.DinnerCarbohydrates ?? preferences.DinnerCarbohydrates,
                  fat: pendingMacros?.DinnerFat ?? preferences.DinnerFat,
                  calories: pendingMacros?.DinnerCalories ?? preferences.DinnerCalories,
                }}
                onUpdate={(macro, value) => handleMacroChange("Dinner", macro, value)}
                isLoading={updateLoading.startsWith("Dinner")}
              />
            </TabsContent>

            <TabsContent value="brunch">
              <MealPreferences
                mealType="Brunch"
                preferences={{
                  protein: pendingMacros?.BrunchProtein ?? preferences.BrunchProtein,
                  carbs: pendingMacros?.BrunchCarbohydrates ?? preferences.BrunchCarbohydrates,
                  fat: pendingMacros?.BrunchFat ?? preferences.BrunchFat,
                  calories: pendingMacros?.BrunchCalories ?? preferences.BrunchCalories,
                }}
                onUpdate={(macro, value) => handleMacroChange("Brunch", macro, value)}
                isLoading={updateLoading.startsWith("Brunch")}
              />
            </TabsContent>
          </Tabs>
          <div className="mt-6 flex justify-end">
            <Button 
              onClick={handleSaveMacros} 
              disabled={updateLoading === "saving"}
              className="w-full md:w-auto"
            >
              {updateLoading === "saving" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Preferences"
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}