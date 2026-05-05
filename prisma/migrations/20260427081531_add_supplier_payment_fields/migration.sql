-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "accountNumber" VARCHAR(100),
ADD COLUMN     "bankName" VARCHAR(100),
ADD COLUMN     "ifscCode" VARCHAR(50),
ADD COLUMN     "upiId" VARCHAR(100);
