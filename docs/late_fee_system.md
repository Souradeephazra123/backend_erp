# Late Fee System Documentation

## Overview
The Late Fee System automatically applies late fees to students who have outstanding fee amounts after the 15th of each month.

## Features
- ✅ Automatic late fee calculation (percentage or fixed amount)
- ✅ Applies late fees only after 15th of month
- ✅ Prevents duplicate late fee application
- ✅ Comprehensive reporting
- ✅ Configurable settings
- ✅ Scheduled automation

## Setup Instructions

### 1. Database Setup
Run the SQL script to set up the database:
```bash
mysql -u your_username -p your_database < sql/late_fee_setup.sql
```

### 2. Install Dependencies
```bash
npm install node-cron moment
```

### 3. Start the Scheduler (Optional)
Add to your main app file (index.js):
```javascript
const LateFeeScheduler = require('./service/lateFeeScheduler');

// Start automatic scheduling
LateFeeScheduler.startMonthlyScheduler(); // Runs on 16th of every month
// OR
LateFeeScheduler.startScheduler(); // Runs daily and checks date
```

## API Endpoints

### 1. Apply Late Fees
**POST** `/api/late-fees/apply`
- Applies late fees to all students with outstanding amounts
- Only works after 15th of month

**Response:**
```json
{
  "success": true,
  "message": "Late fees applied to 5 students",
  "data": {
    "appliedCount": 5,
    "details": [...]
  }
}
```

### 2. Get Outstanding Fees
**GET** `/api/late-fees/outstanding`
- Returns list of students with outstanding fees

### 3. Get Late Fee Report
**GET** `/api/late-fees/report?month=12&year=2024`
- Generate late fee report for specific month/year
- Optional query parameters: `month`, `year`

### 4. Calculate Late Fee (Preview)
**POST** `/api/late-fees/calculate`
```json
{
  "amount": 1000
}
```
- Preview late fee calculation for given amount

### 5. Check Eligibility
**GET** `/api/late-fees/eligibility`
- Check if late fees can be applied (after 15th)

## Configuration

### Late Fee Settings
Edit in `service/lateFeeService.js`:
```javascript
static getLateFeeConfig() {
  return {
    percentage: 5,           // 5% late fee
    fixedAmount: 50,         // or fixed ₹50
    usePercentage: true,     // use percentage vs fixed
    graceThreshold: 100      // minimum amount for late fee
  };
}
```

### Or use Database Configuration
Query the `LateFeeConfig` table:
```sql
SELECT * FROM LateFeeConfig;
UPDATE LateFeeConfig SET config_value = '10' WHERE config_key = 'late_fee_percentage';
```

## How It Works

### 1. Date Check
- System checks if current date > 15th of month
- Late fees only applied after 15th

### 2. Outstanding Fee Detection
- Finds all students with `fee_amount > pay`
- Calculates outstanding amount per student

### 3. Late Fee Calculation
- **Percentage mode**: `outstanding_amount × percentage / 100`
- **Fixed mode**: Fixed amount regardless of outstanding
- **Grace threshold**: No late fee if outstanding < threshold

### 4. Duplicate Prevention
- Checks if late fee already applied this month
- Uses metadata to track original fee ID

### 5. Record Creation
- Creates new fee record with subcategory "Late Fee"
- Stores metadata about original fee

## Database Schema Changes

### Added to Fees Table:
```sql
ALTER TABLE Fees ADD COLUMN metadata JSON NULL;
```

### New Subcategory:
```sql
INSERT INTO FeeSubCategories (subcategory_name, category_id, isActive) 
VALUES ('Late Fee', 1, 1);
```

### New Views:
- `OutstandingFeesView` - Easy access to outstanding fees
- `LateFeeReportView` - Late fee reporting

## Example Usage

### Manual Application
```javascript
const LateFeeService = require('./service/lateFeeService');

// Apply late fees manually
const result = await LateFeeService.applyLateFees();
console.log(result);
```

### Scheduled Application
```javascript
const LateFeeScheduler = require('./service/lateFeeScheduler');

// Start monthly scheduler (16th of every month)
LateFeeScheduler.startMonthlyScheduler();

// Or manual trigger
const result = await LateFeeScheduler.triggerManually();
```

## Reports and Queries

### Outstanding Fees Report
```sql
SELECT * FROM OutstandingFeesView 
WHERE outstanding_amount > 0 
ORDER BY class_id, student_name;
```

### Monthly Late Fee Report
```sql
SELECT * FROM LateFeeReportView 
WHERE applied_month = 12 AND applied_year = 2024;
```

### Late Fee Summary
```sql
SELECT 
    applied_month,
    applied_year,
    COUNT(*) as students_count,
    SUM(late_fee_amount) as total_late_fees,
    SUM(late_fee_outstanding) as total_outstanding
FROM LateFeeReportView 
GROUP BY applied_year, applied_month 
ORDER BY applied_year DESC, applied_month DESC;
```

## Error Handling

### Common Issues:
1. **"Late fees can only be applied after 15th"**
   - Wait until after 15th of month or override date check for testing

2. **"No outstanding fees found"**
   - All students have paid their fees or no fee records exist

3. **"Late Fee subcategory not found"**
   - Run the SQL setup script to create the subcategory

### Testing
To test during development (before 15th):
```javascript
// Override date check in LateFeeService.js
static isAfter15thOfMonth() {
  return true; // Force enable for testing
}
```

## Security Notes
- Late fee application requires authentication
- Use private routes (`/api/late-fees/*`)
- Log all late fee applications for audit trail
- Backup database before running bulk operations

## Maintenance
- Monitor late fee applications through logs
- Review monthly reports for accuracy
- Update configuration as needed
- Regular database cleanup of old metadata
