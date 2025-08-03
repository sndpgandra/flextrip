import { z } from 'zod';

// Session validation
export const SessionSchema = z.object({
  id: z.string().uuid().optional(),
  metadata: z.record(z.any()).optional(),
});

// Traveler validation schemas
export const TravelerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  age: z.number().int().min(1, 'Age must be at least 1').max(120, 'Age must be under 120'),
  mobility: z.enum(['high', 'medium', 'low']).default('high'),
  relationship: z.string().optional().nullable(),
  interests: z.array(z.string()).max(10, 'Maximum 10 interests').optional().nullable(),
  cultural_background: z.string().optional().nullable(),
  dietary_restrictions: z.array(z.string()).max(10, 'Maximum 10 dietary restrictions').optional().nullable(),
});

export const CreateTravelerSchema = TravelerSchema.extend({
  session_id: z.string().uuid('Invalid session ID'),
});

export const UpdateTravelerSchema = TravelerSchema.partial().extend({
  id: z.string().uuid('Invalid traveler ID'),
});

// Trip validation schemas
export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1, 'Message content required').max(4000, 'Message too long'),
  timestamp: z.string().datetime(),
  metadata: z.object({
    model_used: z.string().optional(),
    tokens_used: z.number().optional(),
    response_time: z.number().optional(),
  }).optional(),
});

export const TripSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  destination: z.string().optional(),
  traveler_ids: z.array(z.string().uuid()).min(1, 'At least one traveler required').max(8, 'Maximum 8 travelers'),
  conversation: z.array(ChatMessageSchema),
  ai_models_used: z.array(z.string()).optional(),
  planning_stage: z.enum(['initial', 'detailed', 'finalized']).default('initial'),
  metadata: z.record(z.any()).optional(),
});

export const CreateTripSchema = TripSchema.extend({
  session_id: z.string().uuid('Invalid session ID'),
});

export const UpdateTripSchema = TripSchema.partial().extend({
  id: z.string().uuid('Invalid trip ID'),
});

// Chat API validation
export const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema.omit({ timestamp: true, metadata: true })),
  travelers: z.array(TravelerSchema),
  sessionId: z.string().uuid('Invalid session ID'),
});

// Onboarding validation
export const OnboardingDataSchema = z.object({
  traveler_count: z.number().int().min(1).max(8),
  travelers: z.array(TravelerSchema.omit({ session_id: true })),
  cultural_preferences: z.array(z.string()).optional(),
  completed: z.boolean().default(false),
});

// Rate limiting
export const RateLimitSchema = z.object({
  identifier: z.string(),
  limit: z.number().positive().default(5),
  windowMs: z.number().positive().default(60000), // 1 minute
});

// API response validation
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

// Export types from schemas
export type TravelerInput = z.infer<typeof TravelerSchema>;
export type CreateTravelerInput = z.infer<typeof CreateTravelerSchema>;
export type UpdateTravelerInput = z.infer<typeof UpdateTravelerSchema>;
export type TripInput = z.infer<typeof TripSchema>;
export type CreateTripInput = z.infer<typeof CreateTripSchema>;
export type UpdateTripInput = z.infer<typeof UpdateTripSchema>;
export type ChatMessageInput = z.infer<typeof ChatMessageSchema>;
export type ChatRequestInput = z.infer<typeof ChatRequestSchema>;
export type OnboardingDataInput = z.infer<typeof OnboardingDataSchema>;