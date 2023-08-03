import { z } from "zod";

export const nameSchema = z
.string({
  required_error: "Full name is required",
  invalid_type_error: "Full name must be a string",
})
.min(4, "Full name must be at least 4 characters")
.max(255, "Full name must be at most 255 characters")