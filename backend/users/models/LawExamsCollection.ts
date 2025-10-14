import { Schema, model, Document } from 'mongoose';

// Interface definitions
export interface IQuestion {
    question: string;
    options: string[];
    correctAnswer: string | number;
    explanation: string;
    subject: string; // Add subject to each question
}

export interface ISubjectData {
    subject: string;
    basicQuestions: IQuestion[];
    intermediateQuestions: IQuestion[];
    advancedQuestions: IQuestion[];
}

export interface IExam extends Document {
    _id: string;
    examName: string;
    subjects: ISubjectData[]; // Array of subjects with their questions
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
    },
    subject: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
    }
}, { _id: false });

// Subject Data Schema (embedded)
const SubjectDataSchema = new Schema<ISubjectData>({
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
}, { _id: false });

// Exam Schema
const ExamSchema = new Schema<IExam>({
    examName: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    subjects: {
        type: [SubjectDataSchema],
        required: true,
        default: []
    }
}, {
    timestamps: true,
    collection: 'exams'
});

// Indexes for better performance
ExamSchema.index({ 'subjects.subject': 1 });
ExamSchema.index({ examName: 1 });
ExamSchema.index({ 'subjects.subject': 1, createdAt: -1 });

// Export the model
export const Exam = model<IExam>('Exam', ExamSchema);
