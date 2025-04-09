import mongoose from "mongoose";



// MongoDB connection string from environment variables
const MONGODB_URI =
  "mongodb+srv://paramsavjani:parampbr**@cricket.sl88y.mongodb.net/CRICKET?retryWrites=true&w=majority";

// Match schema definition - using the exact schema you provided
const MatchSchema = new mongoose.Schema(
  {
    teamA: { type: String, required: true },
    teamB: { type: String, required: true },
    matchDate: { type: Date, required: true },
    merkleRoot: { type: String, required: false },
    rewardsCount: { type: Number, required: false },
  },
  { timestamps: true }
);

// Create or use existing Match model
const Match = mongoose.models.Match || mongoose.model("Match", MatchSchema);

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB successfully");
    return true;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    return false;
  }
}

// Function to create a date with the specified time in IST
function createMatchDate(day, month, year, hour, minute) {
  // Create date in local timezone
  const date = new Date(year, month - 1, day, hour, minute);

  // Convert to IST (UTC+5:30)
  // First convert to UTC by subtracting local timezone offset
  const utcDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);

  // Then add IST offset (5 hours and 30 minutes)
  return new Date(utcDate.getTime() + (5 * 60 + 30) * 60000);
}

// IPL matches data from the image
const iplMatches = [
  {
    matchNumber: 26,
    teamA: "Lucknow Super Giants",
    teamB: "Gujarat Titans",
    venue:
      "Bharat Ratna Shri Atal Bihari Vajpayee Ekana Cricket Stadium, Lucknow",
    date: createMatchDate(12, 4, 2025, 15, 30), // April 12, 2024, 3:30 PM IST
    day: "Saturday",
  },
  {
    matchNumber: 27,
    teamA: "Sunrisers Hyderabad",
    teamB: "Punjab Kings",
    venue: "Rajiv Gandhi International Stadium, Hyderabad",
    date: createMatchDate(12, 4, 2025, 19, 30), // April 12, 2024, 7:30 PM IST
    day: "Saturday",
  },
  {
    matchNumber: 28,
    teamA: "Rajasthan Royals",
    teamB: "Royal Challengers Bengaluru",
    venue: "Sawai Mansingh Stadium, Jaipur",
    date: createMatchDate(13, 4, 2025, 15, 30), // April 13, 2024, 3:30 PM IST
    day: "Sunday",
  },
  {
    matchNumber: 29,
    teamA: "Delhi Capitals",
    teamB: "Mumbai Indians",
    venue: "Arun Jaitley Stadium, Delhi",
    date: createMatchDate(13, 4, 2025, 19, 30), // April 13, 2024, 7:30 PM IST
    day: "Sunday",
  },
];

// Add matches to the database
async function addMatchesToDatabase(matches) {
  try {
    // Prepare the match documents according to the schema
    const matchDocuments = matches.map((match) => ({
      teamA: match.teamA,
      teamB: match.teamB,
      matchDate: match.date,
      // Note: merkleRoot and rewardsCount are optional and will be undefined initially
    }));

    // Insert the matches
    const result = await Match.insertMany(matchDocuments);
    console.log(`Successfully added ${result.length} matches to the database`);
    return result;
  } catch (error) {
    console.error("Error adding matches to database:", error);
    return null;
  }
}

// Main function to run the script
async function main() {
  // Connect to database
  const connected = await connectToDatabase();
  if (!connected) {
    console.error("Exiting due to database connection failure");
    process.exit(1);
  }

  // Add matches to database
  console.log("Adding IPL matches to database...");
  const result = await addMatchesToDatabase(iplMatches);

  if (result) {
    console.log("\n✅ Successfully added all IPL matches!");

    // Print the added matches
    console.log("\nAdded matches:");
    result.forEach((match, index) => {
      const matchInfo = iplMatches[index];
      console.log(
        `\nMATCH ${matchInfo.matchNumber}: ${match.teamA} vs ${match.teamB}`
      );
      console.log(`Date: ${match.matchDate.toDateString()} (${matchInfo.day})`);
      console.log(`Time: ${match.matchDate.toLocaleTimeString()}`);
      console.log(`Venue: ${matchInfo.venue}`);
    });
  } else {
    console.error("❌ Failed to add matches to database");
  }

  // Close database connection
  await mongoose.disconnect();
  console.log("\nDisconnected from MongoDB");
}

// Run the script
main().catch(console.error);
