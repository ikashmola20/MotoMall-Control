export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Timestamp = string;

export type UserRole = 'customer' | 'employee' | 'admin';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          first_name: string | null;
          last_name: string | null;
          email: string | null;
          phone: string | null;
          role: UserRole;
          member_since: string | null;
          loyalty_tier: string | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id: string;
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
          phone?: string | null;
          role?: UserRole;
          member_since?: string | null;
          loyalty_tier?: string | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: {
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
          phone?: string | null;
          role?: UserRole;
          member_since?: string | null;
          loyalty_tier?: string | null;
          updated_at?: Timestamp;
        };
        Relationships: [];
      };
      user_addresses: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          recipient_name: string;
          phone: string;
          city: string;
          area: string;
          street: string;
          notes: string | null;
          is_default: boolean;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          user_id: string;
          label: string;
          recipient_name: string;
          phone: string;
          city: string;
          area: string;
          street: string;
          notes?: string | null;
          is_default?: boolean;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: {
          label?: string;
          recipient_name?: string;
          phone?: string;
          city?: string;
          area?: string;
          street?: string;
          notes?: string | null;
          is_default?: boolean;
          updated_at?: Timestamp;
        };
        Relationships: [];
      };
      user_orders: {
        Row: {
          id: string;
          user_id: string;
          order_number: string;
          status: string;
          placed_at: Timestamp;
          estimated_delivery: string | null;
          subtotal: number | null;
          shipping_cost: number | null;
          total_amount: number;
          payment_method: string;
          payment_label: string | null;
          shipping_address: string;
          tracking_code: string | null;
          items: Json;
          timeline: Json;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id: string;
          user_id: string;
          order_number: string;
          status?: string;
          placed_at?: Timestamp;
          estimated_delivery?: string | null;
          subtotal?: number | null;
          shipping_cost?: number | null;
          total_amount: number;
          payment_method: string;
          payment_label?: string | null;
          shipping_address: string;
          tracking_code?: string | null;
          items?: Json;
          timeline?: Json;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: {
          status?: string;
          placed_at?: Timestamp;
          estimated_delivery?: string | null;
          subtotal?: number | null;
          shipping_cost?: number | null;
          total_amount?: number;
          payment_method?: string;
          payment_label?: string | null;
          shipping_address?: string;
          tracking_code?: string | null;
          items?: Json;
          timeline?: Json;
          updated_at?: Timestamp;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          icon: string | null;
          image: string | null;
          product_count: number;
          subcategories: Json;
          is_active: boolean;
          sort_order: number;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id: string;
          name: string;
          slug: string;
          icon?: string | null;
          image?: string | null;
          product_count?: number;
          subcategories?: Json;
          is_active?: boolean;
          sort_order?: number;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: {
          name?: string;
          slug?: string;
          icon?: string | null;
          image?: string | null;
          product_count?: number;
          subcategories?: Json;
          is_active?: boolean;
          sort_order?: number;
          updated_at?: Timestamp;
        };
        Relationships: [];
      };
      brands: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo: string | null;
          country: string | null;
          is_active: boolean;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id: string;
          name: string;
          slug: string;
          logo?: string | null;
          country?: string | null;
          is_active?: boolean;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: {
          name?: string;
          slug?: string;
          logo?: string | null;
          country?: string | null;
          is_active?: boolean;
          updated_at?: Timestamp;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          name: string;
          name_en: string | null;
          slug: string;
          brand_id: string | null;
          brand_name: string | null;
          category_id: string | null;
          category_name: string | null;
          price: number;
          original_price: number | null;
          discount: number | null;
          image: string;
          images: Json;
          description: string | null;
          rating: number | null;
          review_count: number;
          spec_template_id: string | null;
          specs: Json | null;
          in_stock: boolean;
          is_new: boolean;
          is_best_seller: boolean;
          search_text: string | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id: string;
          name: string;
          name_en?: string | null;
          slug: string;
          brand_id?: string | null;
          brand_name?: string | null;
          category_id?: string | null;
          category_name?: string | null;
          price: number;
          original_price?: number | null;
          discount?: number | null;
          image: string;
          images?: Json;
          description?: string | null;
          rating?: number | null;
          review_count?: number;
          spec_template_id?: string | null;
          specs?: Json | null;
          in_stock?: boolean;
          is_new?: boolean;
          is_best_seller?: boolean;
          search_text?: string | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: {
          name?: string;
          name_en?: string | null;
          slug?: string;
          brand_id?: string | null;
          brand_name?: string | null;
          category_id?: string | null;
          category_name?: string | null;
          price?: number;
          original_price?: number | null;
          discount?: number | null;
          image?: string;
          images?: Json;
          description?: string | null;
          rating?: number | null;
          review_count?: number;
          spec_template_id?: string | null;
          specs?: Json | null;
          in_stock?: boolean;
          is_new?: boolean;
          is_best_seller?: boolean;
          search_text?: string | null;
          updated_at?: Timestamp;
        };
        Relationships: [];
      };
      hero_banners: {
        Row: {
          id: string;
          title: string;
          subtitle: string;
          button_text: string;
          button_href: string;
          image: string | null;
          gradient: string | null;
          icon: string | null;
          size: string;
          sort_order: number;
          is_active: boolean;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id: string;
          title: string;
          subtitle: string;
          button_text: string;
          button_href: string;
          image?: string | null;
          gradient?: string | null;
          icon?: string | null;
          size?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: {
          title?: string;
          subtitle?: string;
          button_text?: string;
          button_href?: string;
          image?: string | null;
          gradient?: string | null;
          icon?: string | null;
          size?: string;
          sort_order?: number;
          is_active?: boolean;
          updated_at?: Timestamp;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          id: string;
          store_name: string | null;
          store_description: string | null;
          store_logo: string | null;
          store_phone: string | null;
          store_email: string | null;
          store_address: string | null;
          currency: string | null;
          shipping_provinces: Json;
          payment_methods: Json;
          return_policy: string | null;
          terms_conditions: string | null;
          privacy_policy: string | null;
          seo_title: string | null;
          seo_description: string | null;
          seo_keywords: string | null;
          social_links: Json;
          trust_features: Json;
          footer_copyright: string | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          store_name?: string | null;
          store_description?: string | null;
          store_logo?: string | null;
          store_phone?: string | null;
          store_email?: string | null;
          store_address?: string | null;
          currency?: string | null;
          shipping_provinces?: Json;
          payment_methods?: Json;
          return_policy?: string | null;
          terms_conditions?: string | null;
          privacy_policy?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          seo_keywords?: string | null;
          social_links?: Json;
          trust_features?: Json;
          footer_copyright?: string | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: {
          store_name?: string | null;
          store_description?: string | null;
          store_logo?: string | null;
          store_phone?: string | null;
          store_email?: string | null;
          store_address?: string | null;
          currency?: string | null;
          shipping_provinces?: Json;
          payment_methods?: Json;
          return_policy?: string | null;
          terms_conditions?: string | null;
          privacy_policy?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          seo_keywords?: string | null;
          social_links?: Json;
          trust_features?: Json;
          footer_copyright?: string | null;
          updated_at?: Timestamp;
        };
        Relationships: [];
      };
      admin_comparisons: {
        Row: {
          id: string;
          title: string;
          slug: string | null;
          product_ids: string[];
          is_featured: boolean;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id: string;
          title: string;
          slug?: string | null;
          product_ids?: string[];
          is_featured?: boolean;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: {
          title?: string;
          slug?: string | null;
          product_ids?: string[];
          is_featured?: boolean;
          updated_at?: Timestamp;
        };
        Relationships: [];
      };
      admin_spec_templates: {
        Row: {
          id: string;
          name: string;
          icon: string | null;
          category_id: string | null;
          fields: Json;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id: string;
          name: string;
          icon?: string | null;
          category_id?: string | null;
          fields?: Json;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: {
          name?: string;
          icon?: string | null;
          category_id?: string | null;
          fields?: Json;
          updated_at?: Timestamp;
        };
        Relationships: [];
      };
      admin_reviews: {
        Row: {
          id: string;
          product_id: string;
          product_name: string | null;
          customer_id: string | null;
          customer_name: string | null;
          user_id: string | null;
          rating: number;
          comment: string;
          status: string;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          product_id: string;
          product_name?: string | null;
          customer_id?: string | null;
          customer_name?: string | null;
          user_id?: string | null;
          rating: number;
          comment: string;
          status?: string;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: {
          product_name?: string | null;
          customer_id?: string | null;
          customer_name?: string | null;
          user_id?: string | null;
          rating?: number;
          comment?: string;
          status?: string;
          updated_at?: Timestamp;
        };
        Relationships: [];
      };
      admin_customers: {
        Row: {
          id: string;
          display_name: string;
          email: string | null;
          phone: string | null;
          address: string | null;
          orders_count: number;
          total_spent: number;
          is_active: boolean;
          last_order_at: Timestamp | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id: string;
          display_name: string;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          orders_count?: number;
          total_spent?: number;
          is_active?: boolean;
          last_order_at?: Timestamp | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: {
          display_name?: string;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          orders_count?: number;
          total_spent?: number;
          is_active?: boolean;
          last_order_at?: Timestamp | null;
          updated_at?: Timestamp;
        };
        Relationships: [];
      };
      admin_orders: {
        Row: {
          id: string;
          customer_id: string;
          user_id: string | null;
          order_number: string;
          customer_name: string;
          customer_phone: string;
          customer_email: string | null;
          shipping_address: string;
          payment_method: string;
          payment_label: string | null;
          subtotal: number | null;
          shipping_cost: number | null;
          total_amount: number;
          status: string;
          tracking_code: string | null;
          items: Json;
          timeline: Json;
          placed_at: Timestamp;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id: string;
          customer_id: string;
          user_id?: string | null;
          order_number: string;
          customer_name: string;
          customer_phone: string;
          customer_email?: string | null;
          shipping_address: string;
          payment_method: string;
          payment_label?: string | null;
          subtotal?: number | null;
          shipping_cost?: number | null;
          total_amount: number;
          status?: string;
          tracking_code?: string | null;
          items?: Json;
          timeline?: Json;
          placed_at?: Timestamp;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: {
          customer_id?: string;
          user_id?: string | null;
          order_number?: string;
          customer_name?: string;
          customer_phone?: string;
          customer_email?: string | null;
          shipping_address?: string;
          payment_method?: string;
          payment_label?: string | null;
          subtotal?: number | null;
          shipping_cost?: number | null;
          total_amount?: number;
          status?: string;
          tracking_code?: string | null;
          items?: Json;
          timeline?: Json;
          placed_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
