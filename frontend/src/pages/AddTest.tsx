import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { api } from '../api/Api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface FormData {
  subject: string;
  difficulty: string;
  duration: string;
}

interface FormErrors {
  subject?: string;
  difficulty?: string;
  duration?: string;
  csvFile?: string;
  submit?: string;
}

interface BackendResponse {
  success: boolean;
  message: string;
  data?: {
    _id: string;
    subject: string;
    totalQuestions: number;
    duration: number;
    createdAt?: string;
    updatedAt?: string;
    newQuestionsAdded?: number;
  };
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

const AddTest = () => {
  const navigate = useNavigate();
  const { admin, hasAdminAccess } = useAuth();
  
  // Redirect if not admin
  React.useEffect(() => {
    if (!hasAdminAccess) {
      navigate('/adminPage');
    }
  }, [hasAdminAccess, navigate]);

  const [formData, setFormData] = useState<FormData>({
    subject: '',
    difficulty: '',
    duration: ''
  });
  
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [csvPreview, setCsvPreview] = useState<string[] | null>(null);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Law subjects options (matching backend expectations)
  const subjects = [
    { value: 'constitutional-law', label: 'Constitutional Law' },
    { value: 'criminal-law', label: 'Criminal Law' },
    { value: 'civil-law', label: 'Civil Law' },
    { value: 'corporate-law', label: 'Corporate Law' },
    { value: 'contract-law', label: 'Contract Law' },
    { value: 'property-law', label: 'Property Law' },
    { value: 'family-law', label: 'Family Law' },
    { value: 'administrative-law', label: 'Administrative Law' },
    { value: 'environmental-law', label: 'Environmental Law' },
    { value: 'international-law', label: 'International Law' },
    { value: 'labor-law', label: 'Labor Law' },
    { value: 'tax-law', label: 'Tax Law' }
  ];

  const difficultyLevels = [
    { value: 'basic', label: 'Basic', description: 'Fundamental concepts and principles' },
    { value: 'intermediate', label: 'Intermediate', description: 'Applied knowledge and case studies' },
    { value: 'advanced', label: 'Advanced', description: 'Complex analysis and critical thinking' }
  ];

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | { target: { name: string; value: string } }) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Clear submit status when user makes changes
    if (submitStatus.type) {
      setSubmitStatus({ type: null, message: '' });
    }
  };

  // CSV file upload handler with react-dropzone
  const onDrop = (acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      setErrors(prev => ({
        ...prev,
        csvFile: 'Please upload only CSV files'
      }));
      return;
    }

    const file = acceptedFiles[0];
    if (file) {
      // Check file size (5MB limit to match backend)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          csvFile: 'File size limit exceeded. Maximum size is 5MB'
        }));
        return;
      }

      setCsvFile(file);
      setErrors(prev => ({
        ...prev,
        csvFile: ''
      }));

      // Preview CSV content
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          const lines = text.split('\n').slice(0, 6); // Show header + first 5 lines
          setCsvPreview(lines);
        }
      };
      reader.readAsText(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    maxFiles: 1,
    multiple: false
  });

  const removeFile = () => {
    setCsvFile(null);
    setCsvPreview(null);
    setErrors(prev => ({
      ...prev,
      csvFile: ''
    }));
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.subject) {
      newErrors.subject = 'Please select a subject';
    }

    if (!formData.difficulty) {
      newErrors.difficulty = 'Please select difficulty level';
    }

    if (!formData.duration || parseInt(formData.duration) <= 0) {
      newErrors.duration = 'Please enter valid duration in minutes';
    }

    if (!csvFile) {
      newErrors.csvFile = 'Please upload a CSV file with questions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });
    
    try {
      // Create FormData object (only sending fields that backend actually uses)
      const submitData = new FormData();
      
      // Append only the fields that backend processes
      submitData.append('subject', formData.subject);
      submitData.append('difficulty', formData.difficulty);
      submitData.append('duration', formData.duration);
      
      // Append CSV file (matching backend field name 'questionsFile')
      if (csvFile) {
        submitData.append('questionsFile', csvFile, csvFile.name);
      }

      console.log('Submitting FormData with:', {
        subject: formData.subject,
        difficulty: formData.difficulty,
        duration: formData.duration,
        file: csvFile?.name
      });
      
      // Log the actual FormData contents for debugging
      for (let [key, value] of submitData.entries()) {
        console.log(`FormData field - ${key}:`, value instanceof File ? `File: ${value.name}` : value);
      }

      // Make API call using FormData
      const response: BackendResponse = await api.registerTest(submitData);
      
      if (response.success) {
        // Reset form on success
        setFormData({
          subject: '',
          difficulty: '',
          duration: ''
        });
        setCsvFile(null);
        setCsvPreview(null);
        setErrors({});
        
        setSubmitStatus({
          type: 'success',
          message: response.message || 'Test created successfully!'
        });

        // Redirect to dashboard after a brief delay
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 2000);
      }
      
    } catch (error: any) {
      console.error('Error creating test:', error);
      
      // Handle different types of errors
      if (error.response?.data) {
        const errorData = error.response.data;
        console.log('Error response data:', errorData); // Log the full error response
        
        if (errorData.errors && Array.isArray(errorData.errors)) {
          // Handle validation errors from express-validator
          const newErrors: FormErrors = {};
          errorData.errors.forEach((err: any) => {
            const fieldName = err.param || err.field;
            if (fieldName) {
              newErrors[fieldName as keyof FormErrors] = err.msg || err.message;
              console.log(`Validation error for ${fieldName}:`, err.msg || err.message);
            }
          });
          setErrors(newErrors);
          setSubmitStatus({
            type: 'error',
            message: 'Please fix the validation errors'
          });
        } else if (errorData.message) {
          // Handle general error message
          setSubmitStatus({
            type: 'error',
            message: errorData.message
          });
        }
      } else if (error.message) {
        // Handle direct error message
        setSubmitStatus({
          type: 'error',
          message: error.message
        });
      } else {
        // Handle network or other errors
        setSubmitStatus({
          type: 'error',
          message: 'Network error. Please check your connection and try again.'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render if not admin
  if (!hasAdminAccess) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Add Questions to Test</h1>
        <p className="text-gray-600">Upload CSV questions to existing or new law exam tests</p>
      </div>

      {/* Status Message */}
      {submitStatus.type && (
        <div className={`mb-6 p-4 rounded-lg ${
          submitStatus.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className={`flex items-center ${
            submitStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
          }`}>
            <span className="mr-2">
              {submitStatus.type === 'success' ? '✅' : '❌'}
            </span>
            <span className="font-medium">{submitStatus.message}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Subject and Duration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subject Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <select
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.subject ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            >
              <option value="">Select a subject...</option>
              {subjects.map(subject => (
                <option key={subject.value} value={subject.value}>
                  {subject.label}
                </option>
              ))}
            </select>
            {errors.subject && (
              <p className="text-red-500 text-sm mt-1">{errors.subject}</p>
            )}
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (minutes) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.duration ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., 120"
              min="1"
              disabled={isSubmitting}
            />
            {errors.duration && (
              <p className="text-red-500 text-sm mt-1">{errors.duration}</p>
            )}
          </div>
        </div>

        {/* Difficulty Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Difficulty Level <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {difficultyLevels.map(level => (
              <div
                key={level.value}
                className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  formData.difficulty === level.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${errors.difficulty ? 'border-red-500' : ''} ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={() => !isSubmitting && handleInputChange({ target: { name: 'difficulty', value: level.value } })}
              >
                <input
                  type="radio"
                  name="difficulty"
                  value={level.value}
                  checked={formData.difficulty === level.value}
                  onChange={handleInputChange}
                  className="absolute top-4 right-4"
                  disabled={isSubmitting}
                />
                <h3 className="font-semibold text-gray-800 mb-1">{level.label}</h3>
                <p className="text-sm text-gray-600">{level.description}</p>
              </div>
            ))}
          </div>
          {errors.difficulty && (
            <p className="text-red-500 text-sm mt-1">{errors.difficulty}</p>
          )}
        </div>

        {/* CSV File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Questions File (CSV) <span className="text-red-500">*</span>
          </label>
          
          {!csvFile ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : errors.csvFile 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-gray-300 hover:border-blue-400'
              } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input {...getInputProps()} disabled={isSubmitting} />
              <div className="space-y-2">
                <div className="text-4xl text-gray-400">📄</div>
                <div className="text-lg font-medium text-gray-700">
                  {isDragActive ? 'Drop the CSV file here...' : 'Drag & drop CSV file here'}
                </div>
                <div className="text-sm text-gray-500">or click to select file</div>
                <div className="text-xs text-gray-400 mt-4">
                  CSV format: question, option_a, option_b, option_c, option_d, correct_answer, explanation
                </div>
                <div className="text-xs text-gray-400">
                  Maximum file size: 5MB
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-gray-300 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📄</span>
                  <div>
                    <p className="font-medium text-gray-800">{csvFile.name}</p>
                    <p className="text-sm text-gray-500">{(csvFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="text-red-500 hover:text-red-700 font-medium"
                  disabled={isSubmitting}
                >
                  Remove
                </button>
              </div>
              
              {csvPreview && (
                <div className="mt-4 bg-gray-50 p-3 rounded">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">File Preview:</h4>
                  <div className="text-xs font-mono text-gray-600 space-y-1">
                    {csvPreview.map((line, index) => (
                      <div key={index} className={`truncate ${index === 0 ? 'font-semibold text-gray-800' : ''}`}>
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {errors.csvFile && (
            <p className="text-red-500 text-sm mt-1">{errors.csvFile}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
            onClick={() => navigate('/admin/dashboard')}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Adding Questions...</span>
              </>
            ) : (
              <>
                <span>➕</span>
                <span>Add Questions</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Information Box */}
      <div className="mt-8 bg-amber-50 p-6 rounded-lg border border-amber-200">
        <h3 className="text-lg font-semibold text-amber-800 mb-2">How it works</h3>
        <div className="text-amber-700 text-sm space-y-2">
          <p>• Questions will be added to existing tests or create new ones automatically</p>
          <p>• Tests are organized by <strong>subject</strong> (e.g., Constitutional Law)</p>
          <p>• Questions are categorized by <strong>difficulty level</strong> (Basic, Intermediate, Advanced)</p>
          <p>• If a test exists for the selected subject, questions will be added to the appropriate difficulty section</p>
        </div>
      </div>

      {/* CSV Format Guide */}
      <div className="mt-6 bg-blue-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">CSV Format Guide</h3>
        <p className="text-blue-700 mb-4">Your CSV file should contain the following columns in this exact order:</p>
        <div className="bg-white p-4 rounded border font-mono text-sm">
          <div className="grid grid-cols-7 gap-2 text-center">
            <div className="font-semibold text-gray-700">Question</div>
            <div className="font-semibold text-gray-700">Option A</div>
            <div className="font-semibold text-gray-700">Option B</div>
            <div className="font-semibold text-gray-700">Option C</div>
            <div className="font-semibold text-gray-700">Option D</div>
            <div className="font-semibold text-gray-700">Correct</div>
            <div className="font-semibold text-gray-700">Explanation</div>
          </div>
          <hr className="my-2" />
          <div className="grid grid-cols-7 gap-2 text-xs text-gray-600 text-center">
            <div>Question text</div>
            <div>First option</div>
            <div>Second option</div>
            <div>Third option</div>
            <div>Fourth option</div>
            <div>A/B/C/D</div>
            <div>Answer explanation</div>
          </div>
        </div>
        <div className="mt-4 text-sm text-blue-600">
          <p><strong>Important Notes:</strong></p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Correct answer should be A, B, C, or D (case-insensitive)</li>
            <li>All fields are required for each question</li>
            <li>Maximum file size: 5MB</li>
            <li>File should not contain a header row</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AddTest;
