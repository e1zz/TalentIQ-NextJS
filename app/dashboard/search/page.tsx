'use client'

import { ChevronRight, ChevronLeft, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Question {
  id: string;
  question: string;
  options: string[];
}

const questions: Question[] = [
  {
    id: 'position',
    question: '¿Qué tipo de desarrollador estás buscando?',
    options: ['Frontend Developer', 'Backend Developer', 'Full Stack', 'DevOps', 'Data Scientist']
  },
  {
    id: 'industry',
    question: '¿En qué industria te gustaría que tenga experiencia?',
    options: ['Fintech', 'E-commerce', 'Healthcare', 'Education', 'Enterprise']
  },
  {
    id: 'seniority',
    question: '¿Qué nivel de experiencia necesitas?',
    options: ['Junior', 'Mid-level', 'Senior', 'Lead', 'Architect']
  },
  {
    id: 'skills',
    question: '¿Qué habilidades técnicas son importantes para ti?',
    options: ['React', 'Node.js', 'Python', 'AWS', 'Docker']
  }
];

// Add interfaces for PDF data
interface PDFData {
  id: string;
  name: string;
  url: string;
}

export default function CandidateSurvey() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [pdfs, setPdfs] = useState<PDFData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  const supabase = createClientComponentClient();

  // Function to fetch PDFs from Supabase
  const fetchPDFs = async () => {
    setIsLoading(true);
    try {
      const { data: files, error } = await supabase
        .storage
        .from('resumes') // Replace with your bucket name
        .list();

      if (error) throw error;

      // Get signed URLs for each PDF
      const pdfData = await Promise.all(
        files
          .filter(file => file.name.endsWith('.pdf'))
          .map(async (file) => {
            const { data: { publicUrl } } = supabase
              .storage
              .from('resumes') // Replace with your bucket name
              .getPublicUrl(file.name);

            return {
              id: file.id,
              name: file.name,
              url: publicUrl
            };
          })
      );

      setPdfs(pdfData);
    } catch (error) {
      console.error('Error fetching PDFs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionSelect = (questionId: string, option: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: option
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setShowResults(true);
    await fetchPDFs();
  };

  const question = questions[currentQuestion];

  if (showResults) {
    return (
      <main className="min-h-screen p-6">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-white mb-6">
            Resultados de la búsqueda
          </h2>
          
          {isLoading ? (
            <div className="text-white text-center py-8">Cargando PDFs...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pdfs.map((pdf) => (
                <div 
                  key={pdf.id}
                  className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors"
                >
                  <a 
                    href={pdf.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-white"
                  >
                    <FileText className="h-6 w-6 mr-3 text-blue-500" />
                    <div>
                      <p className="font-medium">{pdf.name}</p>
                      <p className="text-sm text-gray-400">Click para ver el PDF</p>
                    </div>
                  </a>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setShowResults(false)}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Volver al cuestionario
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="h-2 bg-gray-700 rounded-full">
            <div 
              className="h-2 bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
          <p className="text-gray-400 text-sm mt-2">
            Pregunta {currentQuestion + 1} de {questions.length}
          </p>
        </div>

        {/* Question card */}
        <div className="bg-gray-800 rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-6">
            {question.question}
          </h2>

          {/* Options */}
          <div className="space-y-3">
            {question.options.map((option) => (
              <button
                key={option}
                onClick={() => handleOptionSelect(question.id, option)}
                className={`w-full text-left p-4 rounded-lg transition-colors ${
                  answers[question.id] === option
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className={`flex items-center px-4 py-2 rounded-lg ${
                currentQuestion === 0
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              Anterior
            </button>

            {currentQuestion === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Finalizar
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Siguiente
                <ChevronRight className="h-5 w-5 ml-2" />
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
} 