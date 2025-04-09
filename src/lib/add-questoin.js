import mongoose from "mongoose";

const MONGODB_URI =
  "mongodb+srv://paramsavjani:parampbr**@cricket.sl88y.mongodb.net/CRICKET?retryWrites=true&w=majority";

// Match schema definition
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

// Question schema definition
const QuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    isActive: { type: Boolean, default: true },
    closedAt: { type: Date, required: true },
    answer: { type: String, default: null },
    matchId: {
      type: mongoose.Schema.Types.String,
      ref: "Match",
      required: true,
    },
  },
  { timestamps: true }
);

// Create or use existing models
const Match = mongoose.models.Match || mongoose.model("Match", MatchSchema);
const Question =
  mongoose.models.Question || mongoose.model("Question", QuestionSchema);

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

// Format date for display
function formatDate(date) {
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

// Main function to add questions
async function addQuestionsToMatch() {
  try {
    // Find the LSG vs GT match
    const match = await Match.findOne({
      teamA: "Lucknow Super Giants",
      teamB: "Gujarat Titans",
    });
    const matchId = match ? match._id.toString() : null;
    console.log(`Match ID: ${matchId}`);

    if (!match) {
      console.error("Match not found! Please add the LSG vs GT match first.");
      return null;
    }

    console.log(
      `Found match: ${match.teamA} vs ${match.teamB} on ${formatDate(
        match.matchDate
      )}`
    );

    // Create closing date at 6:30 PM on match day
    const matchDate = new Date(match.matchDate);
    const closingDate = new Date(matchDate);
    closingDate.setHours(18, 30, 0, 0); // 6:30 PM

    console.log(
      `Setting closing time for all questions to: ${formatDate(closingDate)}`
    );

    // Define the prediction questions
    const predictionQuestions = [
      {
        question: "Who will score the most runs for Gujarat Titans?",
        options: [
          "Shubman Gill",
          "David Miller",
          "Sai Sudharsan",
          "Rahul Tewatia",
        ],
        isActive: true,
        closedAt: closingDate,
        matchId: matchId,
      },
      {
        question: "Who will take the most wickets for Lucknow Super Giants?",
        options: ["Ravi Bishnoi", "Mark Wood", "Krunal Pandya", "Mohsin Khan"],
        isActive: true,
        closedAt: closingDate,
        matchId: matchId,
      },
      {
        question: "Which team will hit more sixes in the match?",
        options: [
          "Lucknow Super Giants",
          "Gujarat Titans",
          "Equal number",
          "Can't say",
        ],
        isActive: true,
        closedAt: closingDate,
        matchId: matchId,
      },
      {
        question: "Who will win the toss?",
        options: ["LSG", "GT"],
        isActive: true,
        closedAt: closingDate,
        matchId: matchId,
      },
      {
        question: "What will be the method of victory?",
        options: ["Batting first", "Chasing", "Match tied", "No result"],
        isActive: true,
        closedAt: closingDate,
        matchId: matchId,
      },
      {
        question: "Who will have a better powerplay score (1-6 overs)?",
        options: ["LSG", "GT", "Both will score the same", "Can't predict"],
        isActive: true,
        closedAt: closingDate,
        matchId: matchId,
      },
      {
        question: "Which player will be the MVP (Most Valuable Player)?",
        options: [
          "Marcus Stoinis",
          "Rashid Khan",
          "Nicholas Pooran",
          "Hardik Pandya (if playing)",
        ],
        isActive: true,
        closedAt: closingDate,
        matchId: matchId,
      },
      {
        question: "Total number of wickets in the match?",
        options: ["10 or fewer", "11–15", "16–20", "21 or more"],
        isActive: true,
        closedAt: closingDate,
        matchId: matchId,
      },
      {
        question: "Which bowler will concede the most runs?",
        options: ["Avesh Khan", "Alzarri Joseph", "Deepak Hooda", "Noor Ahmad"],
        isActive: true,
        closedAt: closingDate,
        matchId: matchId,
      },
      {
        question: "What will be the final result?",
        options: ["LSG win", "GT win", "Match tied"],
        isActive: true,
        closedAt: closingDate,
        matchId: matchId,
      },
    ];

    // Delete any existing questions for this match (to avoid duplicates)
    await Question.deleteMany({ matchId: matchId });
    console.log(`Cleared any existing questions for this match`);

    // Add the questions to the database
    const result = await Question.insertMany(predictionQuestions);
    console.log(
      `Successfully added ${result.length} prediction questions to the database`
    );

    // Display the added questions
    console.log("\nAdded Questions:");
    result.forEach((q, index) => {
      console.log(`\n${index + 1}. ${q.question}`);
      q.options.forEach((option, i) => {
        console.log(`   ${String.fromCharCode(65 + i)}. ${option}`);
      });
      console.log(`   Closing at: ${formatDate(q.closedAt)}`);
    });

    return result;
  } catch (error) {
    console.error("Error adding questions:", error);
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

  // Add questions to the match
  await addQuestionsToMatch();

  // Close database connection
  await mongoose.disconnect();
  console.log("\nDisconnected from MongoDB");
}

// Run the script
main().catch(console.error);
