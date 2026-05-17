import { z } from "zod";

/**
 * Common validation schemas for the application
 */

// User Login Schema
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid IEEE email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

// User Registration Schema
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

// Event Creation Schema
export const eventSchema = z.object({
  name: z.string().min(3, "Event name must be at least 3 characters long"),
  date: z.string().min(1, "Date is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().min(10, "Description must be at least 10 characters long"),
  imageUrl: z.string().url("Please provide a valid image URL").optional().or(z.literal("")),
});
