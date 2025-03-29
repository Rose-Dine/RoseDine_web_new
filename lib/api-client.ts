import { Logger } from './logger';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

interface MenuItem {
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

interface RecommendationItem {
  item: MenuItem;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  totalCalories: number;
  proteinMatch: number;
  carbsMatch: number;
  fatsMatch: number;
  caloriesMatch: number;
}

interface UserPreferences {
  isVegan: boolean;
  isVegetarian: boolean;
  isGlutenFree: boolean;
  breakfastProtein: number;
  breakfastCarbohydrates: number;
  breakfastFat: number;
  breakfastCalories: number;
  lunchProtein: number;
  lunchCarbohydrates: number;
  lunchFat: number;
  lunchCalories: number;
  dinnerProtein: number;
  dinnerCarbohydrates: number;
  dinnerFat: number;
  dinnerCalories: number;
  brunchProtein: number;
  brunchCarbohydrates: number;
  brunchFat: number;
  brunchCalories: number;
}

class ApiClient {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${BASE_URL}${endpoint}`;
    const startTime = Date.now();

    try {
      Logger.info(`API Request: ${options.method || 'GET'} ${url}`);
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const endTime = Date.now();
      Logger.info(`API Response Time: ${endTime - startTime}ms`);

      if (!response.ok) {
        const errorText = await response.text();
        Logger.error(`API Error: ${response.status} - ${errorText}`);
        return { error: errorText };
      }

      // Handle both JSON and text responses
      const contentType = response.headers.get("content-type");
      let data;
      
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      Logger.debug('API Response:', data);
      return { data };
    } catch (error) {
      Logger.error('API Request Failed:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async login(email: string, password: string): Promise<ApiResponse<string>> {
    return this.request<string>('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  static async register(data: {
    fname: string;
    lname: string;
    email: string;
    password: string;
  }): Promise<ApiResponse<{ token: string }>> {
    const response = await this.request<string>('/api/users/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (response.error) return response;
    
    // Extract token from the success message
    const message = response.data as string;
    const tokenMatch = message.match(/Token: (.*)/);
    const token = tokenMatch ? tokenMatch[1] : '';
    
    return { data: { token } };
  }

  static async verifyEmail(data: {
    token: string;
    code: string;
    fname: string;
    lname: string;
    email: string;
    password: string;
  }): Promise<ApiResponse<void>> {
    return this.request<void>('/api/users/verify-email', {
      method: 'POST',
      body: JSON.stringify(data),
    }).then(response => {
      if (response.data === 'Email verified successfully and user created') {
        return { data: undefined };
      }
      return response;
    });
  }

  static async getMenuItems(date: string, type: string): Promise<ApiResponse<MenuItem[]>> {
    return this.request<MenuItem[]>(`/api/menu-items?date=${date}&type=${type}`);
  }

  static async getUserRating(userId: string, menuItemId: number): Promise<ApiResponse<number>> {
    return this.request<number>(`/api/reviews/${menuItemId}/user-rating?userId=${userId}`);
  }

  static async sendReview(userId: string, menuItemId: number, rating: number): Promise<ApiResponse<void>> {
    const queryParams = new URLSearchParams({
      menuItemId: menuItemId.toString(),
      userId: userId,
      stars: rating.toString()
    });
    
    Logger.info('Sending review:', { userId, menuItemId, rating });
    
    return this.request<void>(`/api/reviews/${menuItemId}?${queryParams.toString()}`, {
      method: 'POST'
    });
  }

  static async getRecommendations(
    userId: string,
    date: string,
    mealType: string
  ): Promise<ApiResponse<RecommendationItem[]>> {
    return this.request<RecommendationItem[]>(
      `/api/recommendations?userId=${userId}&date=${date}&mealType=${mealType}`
    );
  }

  static async getNotifications(userId: string): Promise<ApiResponse<MenuItem[]>> {
    return this.request<MenuItem[]>(`/api/get-notifications?userId=${userId}`);
  }

  static async getUserPreferences(userId: string): Promise<ApiResponse<UserPreferences>> {
    return this.request<UserPreferences>(`/api/user-preferences/get-preferences?userId=${userId}`);
  }

  static async updateDietaryRestriction(
    userId: string,
    restrictionName: string,
    restrictionValue: boolean,
  ): Promise<ApiResponse<void>> {
    const queryParams = new URLSearchParams({
      userId,
      restrictionName,
      restrictionValue: restrictionValue.toString()
    });
    
    return this.request<void>(
      `/api/user-preferences/update-dietary-restriction?${queryParams.toString()}`,
      { method: 'PUT' }
    );
  }

  static async updateMacro(
    userId: string,
    mealType: string,
    macroName: string,
    macroValue: number
  ): Promise<ApiResponse<void>> {
    const queryParams = new URLSearchParams({
      userId,
      mealType,
      macroName,
      macroValue: macroValue.toString()
    });
    
    return this.request<void>(
      `/api/user-preferences/update-macro?${queryParams.toString()}`,
      { method: 'PUT' }
    );
  }
}

export { ApiClient };