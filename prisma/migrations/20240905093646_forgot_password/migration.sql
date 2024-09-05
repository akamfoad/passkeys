-- CreateTable
CREATE TABLE "ForgetPassword" (
    "id" SERIAL NOT NULL,
    "verificationCode" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" INTEGER NOT NULL,

    CONSTRAINT "ForgetPassword_pkey" PRIMARY KEY ("id")
);
