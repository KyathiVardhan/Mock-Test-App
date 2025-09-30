import { Schema, model, Document } from 'mongoose';

// Interface definitions
export interface IQuestion {
    question: string;
    options: string[];
    correctAnswer: string | number;
    explanation: string;
}

export interface ITest extends Document {
    _id: string;
    subject: string;
    basicQuestions: IQuestion[];
    intermediateQuestions: IQuestion[];
    advancedQuestions: IQuestion[];
    duration: number;
    price: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ITestSession extends Document {
    _id: string;
    userId: string;
    subject: string;
    questionCount: 10 | 20 | 50 | 100;
    selectedQuestions: IQuestion[];
    duration: number;
    startTime: Date;
    endTime?: Date;
    score?: number;
    totalQuestions?: number;
    correctAnswers?: number;
    status: 'active' | 'completed' | 'abandoned';
    userAnswers?: Array<{
        questionIndex: number;
        selectedAnswer: string | number;
        isCorrect: boolean;
        timeTaken: number;
    }>;
    createdAt: Date;
    updatedAt: Date;
}

// Question Schema (embedded)
const QuestionSchema = new Schema<IQuestion>({
    question: {
        type: String,
        required: true,
        trim: true
    },
    options: {
        type: [String],
        required: true,
        validate: {
            validator: function(options: string[]) {
                return options.length >= 2 && options.length <= 6;
            },
            message: 'Question must have between 2-6 options'
        }
    },
    correctAnswer: {
        type: Schema.Types.Mixed,
        required: true,
        validate: {
            validator: function(answer: string | number) {
                return typeof answer === 'string' || typeof answer === 'number';
            },
            message: 'Correct answer must be string or number'
        }
    },
    explanation: {
        type: String,
        required: true,
        trim: true
    }
}, { _id: false });

// Test Schema (main collection)
const TestSchema = new Schema<ITest>({
    subject: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
    },
    basicQuestions: {
        type: [QuestionSchema],
        required: true,
        default: []
    },
    intermediateQuestions: {
        type: [QuestionSchema],
        required: true,
        default: []
    },
    advancedQuestions: {
        type: [QuestionSchema],
        required: true,
        default: []
    },
    duration: {
        type: Number,
        required: true,
        min: 1,
        comment: 'Base duration per question in minutes'
    },
    price: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    }
}, {
    timestamps: true,
    collection: 'tests'
});

// User Answer Schema (embedded)
const UserAnswerSchema = new Schema({
    questionIndex: {
        type: Number,
        required: true
    },
    selectedAnswer: {
        type: Schema.Types.Mixed,
        required: true
    },
    isCorrect: {
        type: Boolean,
        required: true
    },
    timeTaken: {
        type: Number,
        required: true,
        min: 0,
        comment: 'Time taken in seconds'
    }
}, { _id: false });

// Test Session Schema
const TestSessionSchema = new Schema<ITestSession>({
    userId: {
        type: String,
        required: true,
        ref: 'User'
    },
    subject: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
    },
    questionCount: {
        type: Number,
        required: true,
        enum: [10, 20, 50, 100]
    },
    selectedQuestions: {
        type: [QuestionSchema],
        required: true,
        validate: {
            validator: function(questions: IQuestion[]) {
                return questions.length === this.questionCount;
            },
            message: 'Selected questions count must match questionCount'
        }
    },
    duration: {
        type: Number,
        required: true,
        min: 1,
        comment: 'Total test duration in minutes'
    },
    startTime: {
        type: Date,
        required: true,
        default: Date.now
    },
    endTime: {
        type: Date,
        validate: {
            validator: function(endTime: Date) {
                return !endTime || endTime > this.startTime;
            },
            message: 'End time must be after start time'
        }
    },
    score: {
        type: Number,
        min: 0,
        max: 100
    },
    totalQuestions: {
        type: Number,
        min: 0
    },
    correctAnswers: {
        type: Number,
        min: 0
    },
    status: {
        type: String,
        required: true,
        enum: ['active', 'completed', 'abandoned'],
        default: 'active'
    },
    userAnswers: {
        type: [UserAnswerSchema],
        default: []
    }
}, {
    timestamps: true,
    collection: 'test_sessions'
});

// Indexes for better performance
TestSchema.index({ subject: 1 });
TestSchema.index({ subject: 1, createdAt: -1 });

TestSessionSchema.index({ userId: 1 });
TestSessionSchema.index({ userId: 1, status: 1 });
TestSessionSchema.index({ userId: 1, createdAt: -1 });
TestSessionSchema.index({ subject: 1, status: 1 });

// Models
export const Test = model<ITest>('Test', TestSchema);
export const TestSession = model<ITestSession>('TestSession', TestSessionSchema);
