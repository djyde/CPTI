import { useState, useEffect } from 'react';
import quizData from '../data/quiz-questions.json';

interface QuizOption {
  text: string;
  dimension: string;
  weight: number;
}

interface QuizQuestion {
  id: number;
  text: string;
  options: QuizOption[];
}

interface QuizAnswer {
  questionId: number;
  selectedOption: QuizOption;
}

export default function Quiz() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const questions: QuizQuestion[] = quizData.questions;
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const canGoPrevious = currentQuestionIndex > 0;

  const calculatePersonalityType = (finalAnswers: QuizAnswer[]): string => {
    // Initialize dimension scores
    const dimensionScores: Record<string, number> = {};

    // Calculate scores for each dimension
    finalAnswers.forEach(answer => {
      const { dimension, weight } = answer.selectedOption;
      dimensionScores[dimension] = (dimensionScores[dimension] || 0) + weight;
    });

    // Define the dimension pairs in the correct order for personality type
    const dimensionPairs = [
      ['U', 'I'], // User-focused vs Infrastructure-focused
      ['R', 'X'], // Reliable vs eXperimental
      ['G', 'Q'], // Craft vs inQuiry
      ['O', 'T']  // Individual vs Team
    ];

    // Determine the winning dimension from each pair
    const personalityType = dimensionPairs.map(([dim1, dim2]) => {
      const score1 = dimensionScores[dim1] || 0;
      const score2 = dimensionScores[dim2] || 0;
      return score1 >= score2 ? dim1 : dim2;
    }).join('');

    return personalityType;
  };

  const handleOptionSelect = (selectedOption: QuizOption) => {
    if (isTransitioning) return;

    const newAnswer: QuizAnswer = {
      questionId: currentQuestion.id,
      selectedOption
    };

    // Update answers array
    const updatedAnswers = answers.filter(a => a.questionId !== currentQuestion.id);
    updatedAnswers.push(newAnswer);
    setAnswers(updatedAnswers);

    // Auto-advance to next question or complete quiz
    setIsTransitioning(true);

    setTimeout(() => {
      if (isLastQuestion) {
        // Quiz completed - calculate personality type and redirect
        const personalityType = calculatePersonalityType(updatedAnswers);
        window.location.href = `/results/${personalityType}`;
      } else {
        // Move to next question
        setCurrentQuestionIndex(prev => prev + 1);
      }
      setIsTransitioning(false);
    }, 300); // Small delay for better UX
  };

  const handlePrevious = () => {
    if (canGoPrevious && !isTransitioning) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const getSelectedOption = (questionId: number): QuizOption | null => {
    const answer = answers.find(a => a.questionId === questionId);
    return answer ? answer.selectedOption : null;
  };

  const selectedOption = getSelectedOption(currentQuestion.id);

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <div className="flex flex-col gap-1 w-full mb-4">
          <div className="flex justify-between text-sm text-flexoki-base-500">
            <span>{currentQuestionIndex + 1} / {questions.length}</span>
          </div>
          <div className="h-2 w-full bg-flexoki-green-50 rounded-full overflow-hidden">
            <div
              className="h-full bg-flexoki-green-500 transition-all duration-300 ease-in-out"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="quiz-content">
        <div className="mb-4">
          <h2 className="text-3xl font-bold text-flexoki-base-800 max-w-[400px]">
            {currentQuestion.text}
          </h2>
        </div>

        <div className="flex flex-col gap-2 items-start">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedOption?.text === option.text;

            return (
              <div
                role="checkbox"
                key={index}
                className={'hover:text-flexoki-base-800 flex items-center cursor-pointer bg-flexoki-green-50/50 ring-flexoki-green-50/50 rounded px-3 py-2 text-flexoki-base-500  lg:w-[400px] w-full text-left hover:bg-flexoki-green-50 transition-all duration-300 ease-in-out'}
                onClick={() => handleOptionSelect(option)}
              >
                <div>
                  <div className="flex items-center justify-center w-4 h-4 mr-2 rounded-full border border-flexoki-green-500">
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-flexoki-green-500"></div>
                    )}
                  </div>
                </div>
                <div className="">
                  {option.text}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3">
        <button
          className={`text-flexoki-green-500 text-sm flex items-center cursor-pointer`}
          onClick={handlePrevious}
          disabled={!canGoPrevious || isTransitioning}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="inline-flex h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>

        <div className="nav-spacer" />
      </div>
    </div>
  );
}
