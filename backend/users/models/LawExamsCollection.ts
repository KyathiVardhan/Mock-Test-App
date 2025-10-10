import { Schema, model, Document } from 'mongoose';

// Interface definitions
export interface IQuestion {
    question: string;
    options: string[];
    correctAnswer: string | number;
    explanation: string;
}

export interface IExam extends Document {
    _id: string;
    examName: string;
    subject: string;
    basicQuestions: IQuestion[];
    intermediateQuestions: IQuestion[];
    advancedQuestions: IQuestion[];
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
                return options.length === 4;
            },
            message: 'Question must have 4 options'
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

// Exam Schema
const ExamSchema = new Schema<IExam>({
    examName: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    subject: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
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
    }
}, {
    timestamps: true,
    collection: 'exams'
});

// Indexes for better performance
ExamSchema.index({ subject: 1 });
ExamSchema.index({ examName: 1 });
ExamSchema.index({ subject: 1, createdAt: -1 });

// Export the model
export const Exam = model<IExam>('Exam', ExamSchema);
