"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApiClient } from "@/lib/api-client";
import { Star, Loader2 } from "lucide-react";
import { Logger } from "@/lib/logger";

export interface MenuItem {
  id: number;
  name: string;
  protein: number;
  carbs: number;
  fats: number;
  calories: number;
  vegan: boolean;
  vegetarian: boolean;
  glutenFree: boolean;
  overallStars: number;
}

interface MenuItemsProps {
  items: MenuItem[];
}
  
const foodImages = {
  default: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
  vegetarian: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd",
  vegan: "https://images.unsplash.com/photo-1533622597524-a1215e26c0a2",
  protein: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f",
};

function getImageForFood(item: MenuItem): string {
  if (item.vegan) return foodImages.vegan;
  if (item.vegetarian) return foodImages.vegetarian;
  if (item.protein > 20) return foodImages.protein;
  return foodImages.default;
}

function StarRating({
  rating,
  onRate,
  onBlur,
  readOnly = false,
  loading = false,
  className = ""
}: {
  rating: number;
  onRate?: (rating: number) => void;
  onBlur?: () => void;
  readOnly?: boolean;
  loading?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : (
        [1, 2, 3, 4, 5].map((star) => (
          <Button
            key={star}
            variant="ghost"
            size="sm"
            onClick={() => !readOnly && onRate?.(star)}
            className={`hover:text-yellow-400 ${
              readOnly ? 'cursor-default' : ''
            } ${rating >= star ? "text-yellow-400" : "text-muted-foreground"}`}
            disabled={readOnly}
          >
            <Star className="h-5 w-5 fill-current" />
          </Button>
        ))
      )}
    </div>
  );
}

export function MenuItems({ items }: MenuItemsProps) {
  const [userRatings, setUserRatings] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState<Record<number, boolean>>({});
  const [pendingRating, setPendingRating] = useState<Record<number, number>>({});

  useEffect(() => {
    // Check both localStorage and sessionStorage for user data
    const localUserData = localStorage.getItem("userData");
    const sessionUserData = sessionStorage.getItem("userData");
    const userData = localUserData || sessionUserData;
    
    if (!userData) return;
    
    const { id: userId } = JSON.parse(userData);

    // Fetch initial user ratings for all items
    items.forEach(async (item) => {
      try {
        const response = await ApiClient.getUserRating(userId, item.id);
        if (!response.error && response.data !== undefined) {
          // Ensure we're only assigning a number to the record
          const rating = response.data;
          setUserRatings(prev => ({ ...prev, [item.id]: rating }));
        }
      } catch (error) {
        Logger.error(`Failed to fetch rating for item ${item.id}:`, error);
      }
    });
  }, [items]);

  const handleRating = async (itemId: number, rating: number) => {
    // Check both localStorage and sessionStorage for user data
    const localUserData = localStorage.getItem("userData");
    const sessionUserData = sessionStorage.getItem("userData");
    const userData = localUserData || sessionUserData;
    
    if (!userData) return;
    
    const { id: userId } = JSON.parse(userData);

    setLoading(prev => ({ ...prev, [itemId]: true }));
    
    try {
      // Optimistically update the UI
      setUserRatings(prev => ({ ...prev, [itemId]: rating }));

      const response = await ApiClient.sendReview(userId, itemId, rating);
      
      if (response.error) {
        // Revert the optimistic update if there's an error
        setUserRatings(prev => {
          // Ensure we're only assigning a number to the record
          const prevRating = prev[itemId] ?? 0; // Default to 0 if undefined
          return { ...prev, [itemId]: prevRating };
        });
        Logger.error(`Failed to submit rating for item ${itemId}:`, response.error);
      } else {
        Logger.info(`Successfully rated item ${itemId} with ${rating} stars`);
      }
    } catch (error) {
      // Revert the optimistic update on error
      setUserRatings(prev => {
        // Ensure we're only assigning a number to the record
        const prevRating = prev[itemId] ?? 0; // Default to 0 if undefined
        return { ...prev, [itemId]: prevRating };
      });
      Logger.error(`Error submitting rating for item ${itemId}:`, error);
    } finally {
      setLoading(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const handleRatingChange = (itemId: number, rating: number) => {
    setPendingRating(prev => ({ ...prev, [itemId]: rating }));
  };

  const handleRatingBlur = (itemId: number) => {
    const value = pendingRating[itemId];
    if (value !== undefined) {
      handleRating(itemId, value);
      setPendingRating(prev => {
        const newState = { ...prev };
        delete newState[itemId];
        return newState;
      });
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card key={item.id} className="overflow-hidden transition-all hover:shadow-lg">
          <div className="relative h-48 overflow-hidden">
            <img
              src={getImageForFood(item)}
              alt={item.name}
              className="w-full h-full object-cover transition-transform hover:scale-105"
            />
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-start gap-2">
              <h3 className="font-semibold text-xl">{item.name}</h3>
              <div className="flex flex-wrap gap-1">
                {item.vegan && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Vegan
                  </Badge>
                )}
                {item.vegetarian && (
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                    Vegetarian
                  </Badge>
                )}
                {item.glutenFree && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Gluten Free
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Protein</span>
                  <span className="font-medium">{item.protein}g</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Carbs</span>
                  <span className="font-medium">{item.carbs}g</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Fat</span>
                  <span className="font-medium">{item.fats}g</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Calories</span>
                  <span className="font-medium">{item.calories}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Overall Rating</span>
                <StarRating rating={item.overallStars} readOnly />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Your Rating</span>
                <StarRating 
                  rating={pendingRating[item.id] ?? userRatings[item.id] ?? 0}
                  onRate={(rating) => handleRatingChange(item.id, rating)}
                  onBlur={() => handleRatingBlur(item.id)}
                  loading={loading[item.id]}
                />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}