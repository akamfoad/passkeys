import { z } from "zod";
import { firstNameSchema, lastNameSchema } from "./user";

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

export const LoginSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
  })
  .required();

export const RegisterSchema = z
  .object({
    firstName: firstNameSchema,
    lastName: lastNameSchema,
    email: emailSchema,
    password: passwordSchema,
  })
  .required();
