"use client";

import { Button } from "@/components/ui/button";

interface MealTypeSelectorProps {
  selectedMealType: string;
  onSelect: (mealType: string) => void;
  selectedDate: Date;
}

export function MealTypeSelector({
  selectedMealType,
  onSelect,
  selectedDate,
}: MealTypeSelectorProps) {
  const isWeekend = selectedDate.getDay() === 0;
  const isSaturday = selectedDate.getDay() === 6;

  // For Saturday, only show Brunch
  if (isSaturday) {
    return (
      <div className="flex gap-2">
        <Button
          variant={selectedMealType === "Brunch" ? "default" : "outline"}
          onClick={() => onSelect("Brunch")}
        >
          Brunch
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {isWeekend ? (
        <>
          <Button
            variant={selectedMealType === "Brunch" ? "default" : "outline"}
            onClick={() => onSelect("Brunch")}
          >
            Brunch
          </Button>
          {!isSaturday && (
            <Button
              variant={selectedMealType === "Dinner" ? "default" : "outline"}
              onClick={() => onSelect("Dinner")}
            >
              Dinner
            </Button>
          )}
        </>
      ) : (
        <>
          <Button
            variant={selectedMealType === "Breakfast" ? "default" : "outline"}
            onClick={() => onSelect("Breakfast")}
          >
            Breakfast
          </Button>
          <Button
            variant={selectedMealType === "Lunch" ? "default" : "outline"}
            onClick={() => onSelect("Lunch")}
          >
            Lunch
          </Button>
          <Button
            variant={selectedMealType === "Dinner" ? "default" : "outline"}
            onClick={() => onSelect("Dinner")}
          >
            Dinner
          </Button>
        </>
      )}
    </div>
  );
}