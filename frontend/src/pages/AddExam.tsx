import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface ExamResponse {
    success: boolean;
    message: string;
    data?: {
        examId: string;
        examName: string;
        subject: string;
        totalQuestions: number;
        breakdown: {
            basic: number;
            intermediate: number;
            advanced: number;
        };
    };
}

function AddExam() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        examName: '',
        csvFile: null as File | null
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', content: '' });
    const [dragActive, setDragActive] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === 'text/csv') {
            setFormData(prev => ({
                ...prev,
                csvFile: file
            }));
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
            setFormData(prev => ({
                ...prev,
                csvFile: file
            }));
            setMessage({ type: '', content: '' });
        } else {
            setMessage({ type: 'error', content: 'Please drop a valid CSV file' });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.examName.trim()) {
            setMessage({ type: 'error', content: 'Please enter an exam name' });
            return;
        }
        
        if (!formData.csvFile) {
            setMessage({ type: 'error', content: 'Please select a CSV file' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', content: '' });

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('examName', formData.examName);
            formDataToSend.append('csvFile', formData.csvFile);

            const response = await fetch('/api/exams/create', {
                method: 'POST',
                credentials: 'include',
                body: formDataToSend
            });

            const result: ExamResponse = await response.json();

            if (result.success) {
                setMessage({ 
                    type: 'success', 
                    content: `Exam "${result.data?.examName}" created successfully with ${result.data?.totalQuestions} questions!` 
                });
                
                // Reset form
                setFormData({ examName: '', csvFile: null });
                
                // Navigate to manage tests after 2 seconds
                setTimeout(() => {
                    navigate('/admin/manage-tests');
                }, 2000);
            } else {
                setMessage({ type: 'error', content: result.message });
            }
        } catch (error) {
            console.error('Error creating exam:', error);
            setMessage({ type: 'error', content: 'Failed to create exam. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/admin/dashboard')}
                        className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
                    >
                        <span className="mr-2">←</span>
                        Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">Add New Exam</h1>
                    <p className="mt-2 text-gray-600">Upload questions via CSV file to create a new mock test</p>
                </div>

                {/* Form */}
                <div className="bg-white shadow-lg rounded-lg p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Exam Name */}
                        <div>
                            <label htmlFor="examName" className="block text-sm font-medium text-gray-700 mb-2">
                                Exam Name *
                            </label>
                            <input
                                type="text"
                                id="examName"
                                name="examName"
                                value={formData.examName}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="e.g., Constitutional Law Mock Test 1"
                                required
                            />
                        </div>

                        {/* File Upload */}
                        <div>
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
                                    {formData.csvFile ? (
                                        <div>
                                            <p className="text-green-600 font-medium">File Selected:</p>
                                            <p className="text-gray-700">{formData.csvFile.name}</p>
                                            <p className="text-sm text-gray-500">
                                                {(formData.csvFile.size / 1024).toFixed(2)} KB
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
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                            <h3 className="text-lg font-medium text-blue-900 mb-3">CSV Format Requirements</h3>
                            <p className="text-blue-800 mb-3">Your CSV file should have the following columns:</p>
                            <div className="bg-white rounded p-4 text-sm font-mono">
                                question,option1,option2,option3,option4,correctAnswer,explanation,difficulty,practiceArea
                            </div>
                            <div className="mt-4 space-y-2 text-sm text-blue-700">
                                <p>• <strong>difficulty:</strong> basic, intermediate, or advanced</p>
                                <p>• <strong>correctAnswer:</strong> Should match one of the options exactly</p>
                                <p>• <strong>practiceArea:</strong> Will be converted to uppercase (e.g., constitutional_law)</p>
                                <p>• All fields are required for each question</p>
                            </div>
                        </div>

                        {/* Message Display */}
                        {message.content && (
                            <div
                                className={`p-4 rounded-lg ${
                                    message.type === 'success'
                                        ? 'bg-green-50 border border-green-200 text-green-700'
                                        : 'bg-red-50 border border-red-200 text-red-700'
                                }`}
                            >
                                {message.content}
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={() => navigate('/admin/dashboard')}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                            >
                                {loading && (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                )}
                                {loading ? 'Creating Exam...' : 'Create Exam'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default AddExam;
