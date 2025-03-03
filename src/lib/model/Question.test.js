import mongoose from "mongoose"
import Question from "./Question"

// Mock mongoose
jest.mock("mongoose", () => {
  const mMongooseModel = {
    findById: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  }

  return {
    Schema: jest.fn().mockImplementation(() => ({
      index: jest.fn().mockReturnThis(),
    })),
    model: jest.fn().mockReturnValue(mMongooseModel),
    models: {
      Question: null,
    },
  }
})

describe("Question Model", () => {
  it("should create a new question", async () => {
    const questionData = {
      question: "Test question?",
      options: ["Option 1", "Option 2", "Option 3"],
    }

    const mockQuestion = {
      _id: "some-id",
      ...questionData,
      isActive: true,
      answer: null,
      closedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    ;(mongoose.model("Question").create).mockResolvedValue(mockQuestion)

    const result = await Question.create(questionData)

    expect(mongoose.model("Question").create).toHaveBeenCalledWith(questionData)
    expect(result).toEqual(mockQuestion)
  })
})