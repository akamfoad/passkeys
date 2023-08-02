import { z } from "zod";

const emailSchema = z
  .string({
    required_error: "Email is required",
    invalid_type_error: "Email must be a string",
  })
  .email("Please provide a correct email address");

const passwordSchema = z
  .string({
    required_error: "Password is required",
    invalid_type_error: "Password must be a string",
  })
  .min(10, "Password must be at least 10 characters")
  .max(255, "Password must be at most 255 characters");

export const SigninSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
  })
  .required();

export const SignupSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    name: z
      .string({
        required_error: "Full name is required",
        invalid_type_error: "Full name must be a string",
      })
      .min(4, "Full name must be at least 4 characters")
      .max(255, "Full name must be at most 255 characters"),
  })
  .required();
