-- SQL Script to add late fee functionality to existing database

-- 1. Add metadata column to Fees table for tracking late fee information
ALTER TABLE `Fees` 
ADD COLUMN `metadata` JSON NULL 
COMMENT 'Store additional information like late fee details' 
AFTER `isActive`;

-- 2. Create or update Late Fee subcategory
INSERT IGNORE INTO `FeeSubCategories` 
(`subcategory_name`, `category_id`, `isActive`, `fee_amount`) 
VALUES ('Late Fee', 1, 1, 0);

-- 3. Remove unique constraint on student_id and subcategory_id to allow multiple late fees
-- Note: This might affect existing data, so backup first
-- ALTER TABLE `Fees` DROP INDEX `student_id`;

-- 4. Create index for better performance on late fee queries
CREATE INDEX `idx_fees_payment_date` ON `Fees` (`payment_date`);
CREATE INDEX `idx_fees_metadata` ON `Fees` ((JSON_EXTRACT(`metadata`, '$.type')));

-- 5. Create a view for easy access to outstanding fees
CREATE OR REPLACE VIEW `OutstandingFeesView` AS
SELECT 
    f.fee_id,
    f.student_id,
    CONCAT(s.firstName, ' ', s.lastName) as student_name,
    s.class_id,
    s.division_id,
    f.fee_amount,
    f.pay as amount_paid,
    (f.fee_amount - f.pay) as outstanding_amount,
    sc.subcategory_name,
    f.payment_date,
    f.isActive,
    CASE 
        WHEN JSON_EXTRACT(f.metadata, '$.type') = 'late_fee' THEN 'Late Fee'
        ELSE 'Regular Fee'
    END as fee_type
FROM Fees f
JOIN students s ON f.student_id = s.id
JOIN FeeSubCategories sc ON f.subcategory_id = sc.subcategory_id
WHERE (f.fee_amount - f.pay) > 0 
AND f.isActive = 1;

-- 6. Create a view for late fee report
CREATE OR REPLACE VIEW `LateFeeReportView` AS
SELECT 
    f.fee_id,
    f.student_id,
    CONCAT(s.firstName, ' ', s.lastName) as student_name,
    s.class_id,
    s.division_id,
    f.fee_amount as late_fee_amount,
    f.pay as late_fee_paid,
    (f.fee_amount - f.pay) as late_fee_outstanding,
    f.payment_date as late_fee_applied_date,
    JSON_EXTRACT(f.metadata, '$.original_outstanding') as original_outstanding_amount,
    JSON_EXTRACT(f.metadata, '$.original_fee_id') as original_fee_id,
    MONTH(f.payment_date) as applied_month,
    YEAR(f.payment_date) as applied_year
FROM Fees f
JOIN students s ON f.student_id = s.id
JOIN FeeSubCategories sc ON f.subcategory_id = sc.subcategory_id
WHERE sc.subcategory_name = 'Late Fee'
AND JSON_EXTRACT(f.metadata, '$.type') = 'late_fee';

-- 7. Insert some sample configuration data (optional)
-- You can create a configuration table for late fee settings
CREATE TABLE IF NOT EXISTS `LateFeeConfig` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `config_key` VARCHAR(100) NOT NULL UNIQUE,
    `config_value` JSON NOT NULL,
    `description` TEXT,
    `isActive` BOOLEAN DEFAULT TRUE,
    `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default late fee configuration
INSERT IGNORE INTO `LateFeeConfig` 
(`config_key`, `config_value`, `description`) 
VALUES 
('late_fee_percentage', '5', 'Percentage of outstanding amount to charge as late fee'),
('late_fee_fixed_amount', '50', 'Fixed amount to charge as late fee'),
('late_fee_use_percentage', 'true', 'Whether to use percentage or fixed amount'),
('late_fee_grace_threshold', '100', 'Minimum outstanding amount to apply late fee'),
('late_fee_application_day', '15', 'Day of month after which late fees can be applied');

-- 8. Verification queries
-- Check if metadata column was added
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Fees' AND COLUMN_NAME = 'metadata';

-- Check if Late Fee subcategory exists
SELECT * FROM FeeSubCategories WHERE subcategory_name = 'Late Fee';

-- Check outstanding fees view
SELECT * FROM OutstandingFeesView LIMIT 5;

-- Check configuration
SELECT * FROM LateFeeConfig;
