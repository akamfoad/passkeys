import { z } from "zod";

const buildNameSchema = (fieldName: string) =>
  z
    .string({
      required_error: `${fieldName} is required`,
      invalid_type_error: `${fieldName} must be a string`,
    })
    .min(4, `${fieldName} must be at least 4 characters`)
    .max(255, `${fieldName} must be at most 255 characters`);

export const firstNameSchema = buildNameSchema("First Name");
export const lastNameSchema = buildNameSchema("Last Name");

export const userSettingsSchema = z
  .object({ firstName: firstNameSchema, lastName: lastNameSchema })
  .required();
