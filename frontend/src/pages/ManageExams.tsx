import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Exam {
    _id: string;
    examName: string;
    practiceAreas: string[]; // Changed from subjects to practiceAreas
    totalQuestions: number;
    breakdown: {
        basic: number;
        intermediate: number;
        advanced: number;
    };
    practiceAreaDetails: { // Changed from subjectDetails to practiceAreaDetails
        practiceArea: string; // Changed from subject to practiceArea
        totalQuestions: number;
        breakdown: {
            basic: number;
            intermediate: number;
            advanced: number;
        };
    }[];
    createdAt: string;
    updatedAt: string;
}

interface ExamResponse {
    success: boolean;
    message: string;
    data?: Exam[];
}

interface AddQuestionsResponse {
    success: boolean;
    message: string;
    data?: {
        examId: string;
        examName: string;
        csvPracticeAreas: string[]; // Changed from csvSubjects to csvPracticeAreas
        questionsAdded: number;
        totalQuestions: number;
        practiceAreas: { // Changed from subjects to practiceAreas
            practiceArea: string;
            totalQuestions: number;
            breakdown: {
                basic: number;
                intermediate: number;
                advanced: number;
            };
        }[];
    };
}

function ManageExams() {
    const navigate = useNavigate();
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
    const [showAddQuestions, setShowAddQuestions] = useState(false);
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', content: '' });
    const [dragActive, setDragActive] = useState(false);

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        try {
            console.log('=== Frontend: Fetching exams ===');
            console.log('API URL: /api/exams');
            
            const response = await fetch('/api/exams', {
                credentials: 'include'
            });
            
            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);
            
            if (response.ok) {
                const result: ExamResponse = await response.json();
                console.log('Response result:', result);
                if (result.success) {
                    console.log('Exams data:', result.data);
                    setExams(result.data || []);
                } else {
                    console.log('API returned success: false');
                    setMessage({ type: 'error', content: result.message || 'Failed to fetch exams' });
                }
            } else {
                const errorText = await response.text();
                console.log('Error response:', errorText);
                setMessage({ type: 'error', content: `Failed to fetch exams: ${response.status}` });
            }
        } catch (error) {
            console.error('Error fetching exams:', error);
            setMessage({ type: 'error', content: 'Failed to fetch exams' });
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === 'text/csv') {
            setCsvFile(file);
            setMessage({ type: '', content: '' });
        } else {
            setMessage({ type: 'error', content: 'Please select a valid CSV file' });
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        const file = e.dataTransfer.files?.[0];
        if (file && file.type === 'text/csv') {
            setCsvFile(file);
            setMessage({ type: '', content: '' });
        } else {
            setMessage({ type: 'error', content: 'Please drop a valid CSV file' });
        }
    };

    const handleAddQuestions = async () => {
        if (!selectedExam || !csvFile) {
            setMessage({ type: 'error', content: 'Please select an exam and CSV file' });
            return;
        }

        setUploadLoading(true);
        setMessage({ type: '', content: '' });

        try {
            const formData = new FormData();
            formData.append('csvFile', csvFile);

            console.log('=== Frontend: Adding questions to exam ===');
            console.log('Exam ID:', selectedExam._id);
            console.log('Exam Name:', selectedExam.examName);
            console.log('API URL:', `/api/exams/${selectedExam._id}/add-questions`);
            console.log('File:', csvFile.name);

            const response = await fetch(`/api/exams/${selectedExam._id}/add-questions`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            console.log('Response status:', response.status);
            const result: AddQuestionsResponse = await response.json();
            console.log('Response result:', result);

            if (result.success) {
                const practiceAreaInfo = result.data?.csvPracticeAreas && result.data.csvPracticeAreas.length > 0 
                    ? ` Questions from practice areas: ${result.data.csvPracticeAreas.join(', ')}.`
                    : '';
                
                setMessage({ 
                    type: 'success', 
                    content: `Successfully added ${result.data?.questionsAdded || 0} questions to "${result.data?.examName}"!${practiceAreaInfo}` 
                });
                
                // Reset form
                setCsvFile(null);
                setSelectedExam(null);
                setShowAddQuestions(false);
                
                // Refresh exams list
                await fetchExams();
            } else {
                setMessage({ type: 'error', content: result.message });
            }
        } catch (error) {
            console.error('Error adding questions:', error);
            setMessage({ type: 'error', content: 'Failed to add questions. Please try again.' });
        } finally {
            setUploadLoading(false);
        }
    };

    const openAddQuestionsModal = (exam: Exam) => {
        setSelectedExam(exam);
        setShowAddQuestions(true);
        setCsvFile(null);
        setMessage({ type: '', content: '' });
    };

    const closeAddQuestionsModal = () => {
        setShowAddQuestions(false);
        setSelectedExam(null);
        setCsvFile(null);
        setMessage({ type: '', content: '' });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/admin/dashboard')}
                        className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
                    >
                        <span className="mr-2">←</span>
                        Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">Manage Exams</h1>
                    <p className="mt-2 text-gray-600">View and manage your exam question banks</p>
                </div>

                {/* Debug Info */}
                <div className="mb-4 p-4 bg-gray-100 rounded-lg">
                    <h4 className="font-medium text-gray-800">Debug Info:</h4>
                    <p className="text-sm text-gray-600">Exams loaded: {exams.length}</p>
                    <p className="text-sm text-gray-600">Loading: {loading ? 'Yes' : 'No'}</p>
                    {exams.length > 0 && (
                        <div className="text-sm text-gray-600">
                            <p>Exam names: {exams.map(e => e.examName).join(', ')}</p>
                        </div>
                    )}
                </div>

                {/* Global Message Display */}
                {message.content && !showAddQuestions && (
                    <div
                        className={`mb-6 p-4 rounded-lg ${
                            message.type === 'success'
                                ? 'bg-green-50 border border-green-200 text-green-700'
                                : 'bg-red-50 border border-red-200 text-red-700'
                        }`}
                    >
                        {message.content}
                    </div>
                )}

                {/* Exams Grid */}
                {exams.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                        <div className="text-6xl mb-4">📚</div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Exams Found</h3>
                        <p className="text-gray-600 mb-6">You haven't created any exams yet.</p>
                        <button
                            onClick={() => navigate('/admin/add-exam')}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Create Your First Exam
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {exams.map((exam) => (
                            <div key={exam._id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-1">
                                            {exam.examName}
                                        </h3>
                                        <div className="text-sm text-gray-600 mb-2">
                                            <p className="font-medium mb-1">Practice Areas:</p>
                                            <div className="flex flex-wrap gap-1">
                                                {exam.practiceAreas?.map((area, index) => (
                                                    <span
                                                        key={index}
                                                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                                                    >
                                                        {area.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                                                    </span>
                                                )) || <span className="text-gray-500 text-xs">No practice areas</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {exam.totalQuestions} Questions
                                        </span>
                                    </div>
                                </div>

                                {/* Question Breakdown */}
                                <div className="mb-4">
                                    <div className="grid grid-cols-3 gap-2 text-center mb-3">
                                        <div className="bg-green-50 rounded-lg p-2">
                                            <div className="text-lg font-semibold text-green-700">{exam.breakdown.basic}</div>
                                            <div className="text-xs text-green-600">Basic</div>
                                        </div>
                                        <div className="bg-yellow-50 rounded-lg p-2">
                                            <div className="text-lg font-semibold text-yellow-700">{exam.breakdown.intermediate}</div>
                                            <div className="text-xs text-yellow-600">Intermediate</div>
                                        </div>
                                        <div className="bg-red-50 rounded-lg p-2">
                                            <div className="text-lg font-semibold text-red-700">{exam.breakdown.advanced}</div>
                                            <div className="text-xs text-red-600">Advanced</div>
                                        </div>
                                    </div>
                                    
                                    {/* Practice Area Breakdown */}
                                    {exam.practiceAreaDetails && exam.practiceAreaDetails.length > 1 && (
                                        <div className="border-t pt-2">
                                            <p className="text-xs font-medium text-gray-600 mb-1">By Practice Area:</p>
                                            <div className="space-y-1">
                                                {exam.practiceAreaDetails.map((area, index) => (
                                                    <div key={index} className="flex justify-between items-center text-xs">
                                                        <span className="text-gray-600">
                                                            {area.practiceArea.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                                                        </span>
                                                        <span className="text-gray-800 font-medium">
                                                            {area.totalQuestions} questions
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => openAddQuestionsModal(exam)}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                                    >
                                        <span className="mr-1">➕</span>
                                        Add Questions
                                    </button>
                                    <button
                                        onClick={() => {
                                            // Future: View exam details
                                            console.log('View exam details:', exam._id);
                                        }}
                                        className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        View
                                    </button>
                                </div>

                                {/* Created Date */}
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <p className="text-xs text-gray-500">
                                        Created: {new Date(exam.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add Questions Modal */}
                {showAddQuestions && selectedExam && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                {/* Modal Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-800">Add Questions to Exam</h2>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Adding questions to: <span className="font-medium">{selectedExam.examName}</span>
                                        </p>
                                        <p className="text-xs text-blue-600 mt-1">
                                            ✓ You can add questions from any practice area to this exam
                                        </p>
                                    </div>
                                    <button
                                        onClick={closeAddQuestionsModal}
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <span className="text-2xl">×</span>
                                    </button>
                                </div>

                                {/* File Upload */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        CSV File *
                                    </label>
                                    <div
                                        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                                            dragActive
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                    >
                                        <input
                                            type="file"
                                            accept=".csv"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div className="space-y-4">
                                            <div className="text-6xl">📄</div>
                                            {csvFile ? (
                                                <div>
                                                    <p className="text-green-600 font-medium">File Selected:</p>
                                                    <p className="text-gray-700">{csvFile.name}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {(csvFile.size / 1024).toFixed(2)} KB
                                                    </p>
                                                </div>
                                            ) : (
                                                <div>
                                                    <p className="text-gray-600">
                                                        Drop your CSV file here or <span className="text-blue-600">browse</span>
                                                    </p>
                                                    <p className="text-sm text-gray-500 mt-2">
                                                        Maximum file size: 10MB
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* CSV Format Info */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                    <h3 className="text-sm font-medium text-blue-900 mb-2">CSV Format Requirements</h3>
                                    <p className="text-blue-800 text-sm mb-2">Your CSV file should have the following columns:</p>
                                    <div className="bg-white rounded p-2 text-xs font-mono text-blue-700">
                                        question,option1,option2,option3,option4,correctAnswer,explanation,difficulty,practiceArea
                                    </div>
                                    <div className="mt-2 space-y-1 text-xs text-blue-700">
                                        <p>• <strong>difficulty:</strong> basic, intermediate, or advanced</p>
                                        <p>• <strong>correctAnswer:</strong> Should match one of the options exactly</p>
                                        <p>• <strong>practiceArea:</strong> Can be any law practice area (will be added to this exam)</p>
                                        <p>• <strong>Note:</strong> Questions with different practice areas will be organized under this exam</p>
                                    </div>
                                </div>

                                {/* Message Display */}
                                {message.content && (
                                    <div
                                        className={`p-4 rounded-lg mb-6 ${
                                            message.type === 'success'
                                                ? 'bg-green-50 border border-green-200 text-green-700'
                                                : 'bg-red-50 border border-red-200 text-red-700'
                                        }`}
                                    >
                                        {message.content}
                                    </div>
                                )}

                                {/* Modal Actions */}
                                <div className="flex justify-end space-x-4">
                                    <button
                                        type="button"
                                        onClick={closeAddQuestionsModal}
                                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddQuestions}
                                        disabled={uploadLoading || !csvFile}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                                    >
                                        {uploadLoading && (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        )}
                                        {uploadLoading ? 'Adding Questions...' : 'Add Questions'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ManageExams;
