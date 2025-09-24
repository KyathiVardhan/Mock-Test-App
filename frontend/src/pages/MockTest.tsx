import  { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle } from 'lucide-react';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export default function MockTest() {
  const { category } = useParams();
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [timeLeft, setTimeLeft] = useState(2700); // 45 minutes
  const [testStarted, setTestStarted] = useState(false);
  const [loading, setLoading] = useState(true);

  const mockQuestions: { [key: string]: Question[] } = {
    constitutional: [
      {
        id: 1,
        question: "Which amendment to the U.S. Constitution guarantees freedom of speech?",
        options: ["First Amendment", "Second Amendment", "Fourth Amendment", "Fifth Amendment"],
        correctAnswer: 0,
        explanation: "The First Amendment protects freedom of speech, religion, press, assembly, and petition."
      },
      {
        id: 2,
        question: "What is the 'Commerce Clause' primarily used for?",
        options: [
          "Regulating international trade only",
          "Giving Congress power to regulate interstate commerce",
          "Protecting state rights",
          "Establishing federal courts"
        ],
        correctAnswer: 1,
        explanation: "The Commerce Clause gives Congress the power to regulate interstate and foreign commerce."
      },
      {
        id: 3,
        question: "Which constitutional principle ensures no branch of government becomes too powerful?",
        options: ["Federalism", "Separation of Powers", "Due Process", "Equal Protection"],
        correctAnswer: 1,
        explanation: "Separation of Powers divides government into three branches with checks and balances."
      }
    ],
    criminal: [
      {
        id: 1,
        question: "What burden of proof is required in criminal cases?",
        options: [
          "Preponderance of evidence",
          "Clear and convincing evidence",
          "Beyond a reasonable doubt",
          "Probable cause"
        ],
        correctAnswer: 2,
        explanation: "Criminal cases require proof 'beyond a reasonable doubt,' the highest burden of proof."
      },
      {
        id: 2,
        question: "Which constitutional amendment protects against double jeopardy?",
        options: ["Fourth Amendment", "Fifth Amendment", "Sixth Amendment", "Eighth Amendment"],
        correctAnswer: 1,
        explanation: "The Fifth Amendment protects against double jeopardy, self-incrimination, and due process violations."
      }
    ]
  };

  useEffect(() => {
    // Simulate loading test questions
    setTimeout(() => {
      if (category && mockQuestions[category]) {
        setQuestions(mockQuestions[category]);
      } else {
        setQuestions(mockQuestions.constitutional);
      }
      setLoading(false);
    }, 1000);
  }, [category]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (testStarted && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0) {
      handleSubmitTest();
    }
    return () => clearTimeout(timer);
  }, [testStarted, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTest = () => {
    setTestStarted(true);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion]: answerIndex
    });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmitTest = () => {
    const score = calculateScore();
    navigate(`/results/test-${Date.now()}`, { 
      state: { score, total: questions.length, answers: selectedAnswers, questions } 
    });
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading test questions...</p>
        </div>
      </div>
    );
  }

  if (!testStarted) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4 capitalize">
              {category?.replace('-', ' ')} Law Test
            </h1>
            <p className="text-gray-600 mb-6">
              You're about to start a comprehensive mock test. Please read the instructions carefully.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Test Information</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• {questions.length} multiple choice questions</li>
                <li>• {Math.floor(timeLeft / 60)} minutes time limit</li>
                <li>• Choose the best answer for each question</li>
                <li>• You can navigate between questions</li>
              </ul>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Instructions</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Read each question carefully</li>
                <li>• Select only one answer per question</li>
                <li>• You can review and change answers</li>
                <li>• Submit when finished or time expires</li>
              </ul>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={handleStartTest}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Start Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-600">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <div className="w-64 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-orange-600">
            <Clock className="h-5 w-5" />
            <span className="font-mono font-semibold">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {questions[currentQuestion]?.question}
        </h2>

        <div className="space-y-3">
          {questions[currentQuestion]?.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                selectedAnswers[currentQuestion] === index
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                  selectedAnswers[currentQuestion] === index
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}>
                  {selectedAnswers[currentQuestion] === index && (
                    <CheckCircle className="h-4 w-4 text-white" />
                  )}
                </div>
                <span className="font-medium mr-3">{String.fromCharCode(65 + index)}.</span>
                <span>{option}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex space-x-3">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={currentQuestion === questions.length - 1}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleSubmitTest}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              Submit Test
            </button>
          </div>
        </div>

        {/* Question indicators */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`w-10 h-10 rounded-lg text-sm font-semibold transition-colors ${
                  selectedAnswers[index] !== undefined
                    ? index === currentQuestion
                      ? 'bg-green-600 text-white'
                      : 'bg-green-100 text-green-800'
                    : index === currentQuestion
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-100 rounded mr-1"></div>
              <span>Answered</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-600 rounded mr-1"></div>
              <span>Current</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-100 rounded mr-1"></div>
              <span>Unanswered</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}