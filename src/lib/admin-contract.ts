import type {
  AdminUser,
  Brand,
  Category,
  Comparison,
  Customer,
  CustomerCrmStatus,
  CustomerInteraction,
  CustomerInteractionType,
  CustomerNote,
  CustomerTask,
  CustomerTaskPriority,
  CustomerTaskStatus,
  HeroBanner,
  Order,
  Product,
  ProfileRole,
  Review,
  SiteSettings,
  SpecTemplate,
} from '@/types/admin';

export interface AdminDashboardSnapshot {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  orders: Order[];
  customers: Customer[];
  reviews: Review[];
  comparisons: Comparison[];
  specTemplates: SpecTemplate[];
  settings: SiteSettings;
  heroBanners: HeroBanner[];
  teamMembers: AdminUser[];
}

export interface TeamRoleMutation {
  userId?: string;
  email?: string;
  role: ProfileRole;
}

export type CustomerCrmMutation =
  | {
      action: 'update-customer';
      customerId: string;
      crmStatus?: CustomerCrmStatus;
      assignedTo?: string | null;
      nextFollowUpAt?: string | null;
      internalRating?: number;
      isActive?: boolean;
    }
  | {
      action: 'add-note';
      customerId: string;
      body: string;
    }
  | {
      action: 'delete-note';
      customerId: string;
      noteId: CustomerNote['id'];
    }
  | {
      action: 'add-task';
      customerId: string;
      title: string;
      description?: string;
      dueAt?: string;
      priority?: CustomerTaskPriority;
      assignedTo?: string | null;
    }
  | {
      action: 'update-task';
      customerId: string;
      taskId: CustomerTask['id'];
      title?: string;
      description?: string;
      dueAt?: string | null;
      status?: CustomerTaskStatus;
      priority?: CustomerTaskPriority;
      assignedTo?: string | null;
    }
  | {
      action: 'delete-task';
      customerId: string;
      taskId: CustomerTask['id'];
    }
  | {
      action: 'add-interaction';
      customerId: string;
      type: CustomerInteractionType;
      summary: string;
      occurredAt?: string;
    }
  | {
      action: 'delete-interaction';
      customerId: string;
      interactionId: CustomerInteraction['id'];
    }
  | {
      action: 'add-tag';
      customerId: string;
      name: string;
      color?: string;
    }
  | {
      action: 'remove-tag';
      customerId: string;
      tagId: string;
    };
