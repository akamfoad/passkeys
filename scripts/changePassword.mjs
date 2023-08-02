import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

export const db = new PrismaClient();

const hashedPassword = bcrypt.hashSync("0123456789", 10);

console.log(hashedPassword)