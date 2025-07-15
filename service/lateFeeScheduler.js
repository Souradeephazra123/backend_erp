const cron = require("node-cron");
const LateFeeService = require("../service/lateFeeService");

class LateFeeScheduler {
  // Schedule late fee application to run daily at 9 AM
  static startScheduler() {
    // Run daily at 9:00 AM
    cron.schedule("0 9 * * *", async () => {
      console.log("Checking for late fee application...");

      try {
        if (LateFeeService.isAfter15thOfMonth()) {
          const result = await LateFeeService.applyLateFees();

          if (result.appliedCount > 0) {
            console.log(`Late fees applied to ${result.appliedCount} students`);
            console.log("Late fee application details:", result.details);
          } else {
            console.log(
              "No late fees applied - either already applied or no outstanding fees"
            );
          }
        } else {
          console.log("Late fees can only be applied after 15th of the month");
        }
      } catch (error) {
        console.error("Error in scheduled late fee application:", error);
      }
    });

    console.log("Late fee scheduler started - will run daily at 9:00 AM");
  }

  // Manual trigger for testing (run immediately if after 15th)
  static async triggerManually() {
    try {
      console.log("Manually triggering late fee application...");

      if (LateFeeService.isAfter15thOfMonth()) {
        const result = await LateFeeService.applyLateFees();
        console.log("Manual late fee application result:", result);
        return result;
      } else {
        const message = "Late fees can only be applied after 15th of the month";
        console.log(message);
        return { success: false, message };
      }
    } catch (error) {
      console.error("Error in manual late fee application:", error);
      throw error;
    }
  }

  // Schedule to run on specific dates (16th of every month at 9 AM)
  static startMonthlyScheduler() {
    // Run on 16th of every month at 9:00 AM
    cron.schedule("0 9 16 * *", async () => {
      console.log("Monthly late fee application triggered on 16th...");

      try {
        const result = await LateFeeService.applyLateFees();

        console.log(`Monthly late fee application completed:`);
        console.log(`- Students affected: ${result.appliedCount}`);
        console.log(`- Status: ${result.message}`);

        if (result.details && result.details.length > 0) {
          console.log("Detailed results:", result.details);
        }
      } catch (error) {
        console.error("Error in monthly late fee application:", error);
      }
    });

    console.log(
      "Monthly late fee scheduler started - will run on 16th of every month at 9:00 AM"
    );
  }

  // Stop all scheduled jobs
  static stopScheduler() {
    cron.getTasks().forEach((task) => task.stop());
    console.log("All late fee schedulers stopped");
  }
}

module.exports = LateFeeScheduler;
