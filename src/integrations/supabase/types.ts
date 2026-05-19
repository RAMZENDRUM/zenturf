export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      bookings: {
        Row: {
          booking_date: string;
          booking_ref: string;
          cancellation_reason: string | null;
          created_at: string;
          end_time: string;
          group_members: Json;
          id: string;
          payment_id: string | null;
          payment_status: Database["public"]["Enums"]["payment_status"];
          qr_code_data: string | null;
          refund_amount: number;
          slot_id: string;
          sport_type: string | null;
          start_time: string;
          status: Database["public"]["Enums"]["booking_status"];
          total_price: number;
          user_id: string;
          venue_id: string;
        };
        Insert: {
          booking_date: string;
          booking_ref?: string;
          cancellation_reason?: string | null;
          created_at?: string;
          end_time: string;
          group_members?: Json;
          id?: string;
          payment_id?: string | null;
          payment_status?: Database["public"]["Enums"]["payment_status"];
          qr_code_data?: string | null;
          refund_amount?: number;
          slot_id: string;
          sport_type?: string | null;
          start_time: string;
          status?: Database["public"]["Enums"]["booking_status"];
          total_price: number;
          user_id: string;
          venue_id: string;
        };
        Update: {
          booking_date?: string;
          booking_ref?: string;
          cancellation_reason?: string | null;
          created_at?: string;
          end_time?: string;
          group_members?: Json;
          id?: string;
          payment_id?: string | null;
          payment_status?: Database["public"]["Enums"]["payment_status"];
          qr_code_data?: string | null;
          refund_amount?: number;
          slot_id?: string;
          sport_type?: string | null;
          start_time?: string;
          status?: Database["public"]["Enums"]["booking_status"];
          total_price?: number;
          user_id?: string;
          venue_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_slot_id_fkey";
            columns: ["slot_id"];
            isOneToOne: true;
            referencedRelation: "slots";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_venue_id_fkey";
            columns: ["venue_id"];
            isOneToOne: false;
            referencedRelation: "venues";
            referencedColumns: ["id"];
          },
        ];
      };
      favourites: {
        Row: {
          created_at: string;
          user_id: string;
          venue_id: string;
        };
        Insert: {
          created_at?: string;
          user_id: string;
          venue_id: string;
        };
        Update: {
          created_at?: string;
          user_id?: string;
          venue_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "favourites_venue_id_fkey";
            columns: ["venue_id"];
            isOneToOne: false;
            referencedRelation: "venues";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          created_at: string;
          id: string;
          is_read: boolean;
          message: string;
          type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_read?: boolean;
          message: string;
          type: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_read?: boolean;
          message?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string | null;
          id: string;
          name: string | null;
          phone: string | null;
          wallet_credits: number;
          age: number | null;
          place: string | null;
          interested_sports: string[] | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          id: string;
          name?: string | null;
          phone?: string | null;
          wallet_credits?: number;
          age?: number | null;
          place?: string | null;
          interested_sports?: string[] | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          name?: string | null;
          phone?: string | null;
          wallet_credits?: number;
          age?: number | null;
          place?: string | null;
          interested_sports?: string[] | null;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          booking_id: string | null;
          comment: string | null;
          created_at: string;
          id: string;
          rating: number;
          user_id: string;
          venue_id: string;
        };
        Insert: {
          booking_id?: string | null;
          comment?: string | null;
          created_at?: string;
          id?: string;
          rating: number;
          user_id: string;
          venue_id: string;
        };
        Update: {
          booking_id?: string | null;
          comment?: string | null;
          created_at?: string;
          id?: string;
          rating?: number;
          user_id?: string;
          venue_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: true;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_venue_id_fkey";
            columns: ["venue_id"];
            isOneToOne: false;
            referencedRelation: "venues";
            referencedColumns: ["id"];
          },
        ];
      };
      slots: {
        Row: {
          booked_by: string | null;
          date: string;
          end_time: string;
          id: string;
          is_booked: boolean;
          price_override: number | null;
          start_time: string;
          venue_id: string;
        };
        Insert: {
          booked_by?: string | null;
          date: string;
          end_time: string;
          id?: string;
          is_booked?: boolean;
          price_override?: number | null;
          start_time: string;
          venue_id: string;
        };
        Update: {
          booked_by?: string | null;
          date?: string;
          end_time?: string;
          id?: string;
          is_booked?: boolean;
          price_override?: number | null;
          start_time?: string;
          venue_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "slots_venue_id_fkey";
            columns: ["venue_id"];
            isOneToOne: false;
            referencedRelation: "venues";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      venues: {
        Row: {
          address: string | null;
          amenities: string[];
          capacity: number | null;
          city: string | null;
          created_at: string;
          description: string | null;
          id: string;
          is_approved: boolean;
          lat: number | null;
          lng: number | null;
          name: string;
          owner_id: string | null;
          photos: string[];
          price_per_day: number | null;
          price_per_hour: number;
          rating: number;
          sport_tags: string[];
          total_reviews: number;
          type: Database["public"]["Enums"]["venue_type"];
        };
        Insert: {
          address?: string | null;
          amenities?: string[];
          capacity?: number | null;
          city?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_approved?: boolean;
          lat?: number | null;
          lng?: number | null;
          name: string;
          owner_id?: string | null;
          photos?: string[];
          price_per_day?: number | null;
          price_per_hour?: number;
          rating?: number;
          sport_tags?: string[];
          total_reviews?: number;
          type: Database["public"]["Enums"]["venue_type"];
        };
        Update: {
          address?: string | null;
          amenities?: string[];
          capacity?: number | null;
          city?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_approved?: boolean;
          lat?: number | null;
          lng?: number | null;
          name?: string;
          owner_id?: string | null;
          photos?: string[];
          price_per_day?: number | null;
          price_per_hour?: number;
          rating?: number;
          sport_tags?: string[];
          total_reviews?: number;
          type?: Database["public"]["Enums"]["venue_type"];
        };
        Relationships: [];
      };
      waitlist: {
        Row: {
          created_at: string;
          id: string;
          notified: boolean;
          slot_id: string | null;
          user_id: string;
          venue_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          notified?: boolean;
          slot_id?: string | null;
          user_id: string;
          venue_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          notified?: boolean;
          slot_id?: string | null;
          user_id?: string;
          venue_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "waitlist_slot_id_fkey";
            columns: ["slot_id"];
            isOneToOne: false;
            referencedRelation: "slots";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "waitlist_venue_id_fkey";
            columns: ["venue_id"];
            isOneToOne: false;
            referencedRelation: "venues";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "user" | "owner" | "admin";
      booking_status: "confirmed" | "cancelled" | "completed";
      payment_status: "pending" | "paid" | "refunded";
      venue_type: "turf" | "court" | "auditorium";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["user", "owner", "admin"],
      booking_status: ["confirmed", "cancelled", "completed"],
      payment_status: ["pending", "paid", "refunded"],
      venue_type: ["turf", "court", "auditorium"],
    },
  },
} as const;
