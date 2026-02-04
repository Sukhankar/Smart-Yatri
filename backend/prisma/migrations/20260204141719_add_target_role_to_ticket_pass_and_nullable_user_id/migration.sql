-- DropForeignKey
ALTER TABLE `pass` DROP FOREIGN KEY `Pass_userId_fkey`;

-- DropForeignKey
ALTER TABLE `payment` DROP FOREIGN KEY `Payment_userId_fkey`;

-- DropForeignKey
ALTER TABLE `ticket` DROP FOREIGN KEY `Ticket_userId_fkey`;

-- DropIndex
DROP INDEX `Pass_userId_fkey` ON `pass`;

-- DropIndex
DROP INDEX `Payment_userId_fkey` ON `payment`;

-- AlterTable
ALTER TABLE `pass` ADD COLUMN `targetRole` VARCHAR(191) NULL,
    MODIFY `userId` INTEGER NULL;

-- AlterTable
ALTER TABLE `payment` MODIFY `userId` INTEGER NULL;

-- AlterTable
ALTER TABLE `ticket` ADD COLUMN `targetRole` VARCHAR(191) NULL,
    MODIFY `userId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Pass` ADD CONSTRAINT `Pass_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `UserLogin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `UserLogin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ticket` ADD CONSTRAINT `Ticket_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `UserLogin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
