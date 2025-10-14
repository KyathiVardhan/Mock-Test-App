import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Exam {
    _id: string;
    examName: string;
    subjects: string[];
    totalQuestions: number;
    breakdown: {
        basic: number;
        intermediate: number;
        advanced: number;
    };
    subjectDetails: {
        subject: string;
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

interface AddNewSubjectResponse {
    success: boolean;
    message: string;
    data?: {
        examId: string;
        examName: string;
        newSubject: string;
        questionsAdded: {
            basic: number;
            intermediate: number;
            advanced: number;
        };
        totalQuestions: number;
        subjects: {
            subject: string;
            totalQuestions: number;
            breakdown: {
                basic: number;
                intermediate: number;
                advanced: number;
            };
        }[];
    };
}

function AddNewSubjectToExam() {
    const navigate = useNavigate();
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
    const [newSubject, setNewSubject] = useState('');
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
            
            const response = await fetch('/api/exams', {
                credentials: 'include'
            });
            
            console.log('Response status:', response.status);
            
            if (response.ok) {
                const result: ExamResponse = await response.json();
                console.log('Response result:', result);
                if (result.success) {
                    setExams(result.data || []);
                } else {
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

    const handleAddNewSubject = async () => {
        if (!selectedExam || !newSubject.trim() || !csvFile) {
            setMessage({ type: 'error', content: 'Please select an exam, enter a new subject, and upload a CSV file' });
            return;
        }

        setUploadLoading(true);
        setMessage({ type: '', content: '' });

        try {
            const formData = new FormData();
            formData.append('examId', selectedExam._id);
            formData.append('newSubject', newSubject.trim());
            formData.append('csvFile', csvFile);

            console.log('=== Frontend: Adding new subject to exam ===');
            console.log('Exam ID:', selectedExam._id);
            console.log('New Subject:', newSubject);
            console.log('File:', csvFile.name);

            const response = await fetch('/api/exams/add-new-subject', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            console.log('Response status:', response.status);
            const result: AddNewSubjectResponse = await response.json();
            console.log('Response result:', result);

            if (result.success) {
                setMessage({ 
                    type: 'success', 
                    content: `Successfully added new subject "${result.data?.newSubject}" to exam "${result.data?.examName}"! Added: ${result.data?.questionsAdded.basic} basic, ${result.data?.questionsAdded.intermediate} intermediate, ${result.data?.questionsAdded.advanced} advanced questions.` 
                });
                
                // Reset form
                setCsvFile(null);
                setSelectedExam(null);
                setNewSubject('');
                
                // Refresh exams list
                await fetchExams();
            } else {
                setMessage({ type: 'error', content: result.message });
            }
        } catch (error) {
            console.error('Error adding new subject:', error);
            setMessage({ type: 'error', content: 'Failed to add new subject. Please try again.' });
        } finally {
            setUploadLoading(false);
        }
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
                    <h1 className="text-3xl font-bold text-gray-900">Add New Subject to Existing Exam</h1>
                    <p className="mt-2 text-gray-600">Add a new subject to an existing exam document</p>
                </div>

                {/* Form */}
                <div className="bg-white shadow-lg rounded-lg p-8">
                    <form className="space-y-6">
                        {/* Select Existing Exam */}
                        <div>
                            <label htmlFor="examSelect" className="block text-sm font-medium text-gray-700 mb-2">
                                Select Base Exam *
                            </label>
                            <select
                                id="examSelect"
                                value={selectedExam?._id || ''}
                                onChange={(e) => {
                                    const exam = exams.find(ex => ex._id === e.target.value);
                                    setSelectedExam(exam || null);
                                }}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                required
                            >
                                <option value="">Choose an exam to base the new subject on...</option>
                                {exams.map((exam) => (
                                    <option key={exam._id} value={exam._id}>
                                        {exam.examName} ({exam.subjects.length > 0 ? exam.subjects[0].replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : 'No subjects'})
                                    </option>
                                ))}
                            </select>
                            {selectedExam && (
                                <div className="mt-2 text-sm text-gray-600">
                                    <p>Selected: <span className="font-medium">{selectedExam.examName}</span></p>
                                    <p>Current Subjects: <span className="font-medium">{selectedExam.subjects.map(subject => subject.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())).join(', ')}</span></p>
                                    <p>Current Questions: <span className="font-medium">{selectedExam.totalQuestions}</span></p>
                                </div>
                            )}
                        </div>

                        {/* New Subject Name */}
                        <div>
                            <label htmlFor="newSubject" className="block text-sm font-medium text-gray-700 mb-2">
                                New Subject Name *
                            </label>
                            <input
                                type="text"
                                id="newSubject"
                                value={newSubject}
                                onChange={(e) => setNewSubject(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="e.g., Criminal Law, Contract Law, Tort Law"
                                required
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                This will add a new subject to the existing exam: "{selectedExam?.examName}"
                            </p>
                        </div>

                        {/* File Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                CSV File for New Subject *
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
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                            <h3 className="text-lg font-medium text-blue-900 mb-3">CSV Format Requirements</h3>
                            <p className="text-blue-800 mb-3">Your CSV file should have the following columns:</p>
                            <div className="bg-white rounded p-4 text-sm font-mono">
                                question,option1,option2,option3,option4,correctAnswer,explanation,difficulty,subject
                            </div>
                            <div className="mt-4 space-y-2 text-sm text-blue-700">
                                <p>• <strong>difficulty:</strong> basic, intermediate, or advanced</p>
                                <p>• <strong>correctAnswer:</strong> Should match one of the options exactly</p>
                                <p>• <strong>subject:</strong> Should match the new subject you entered above</p>
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
                                type="button"
                                onClick={handleAddNewSubject}
                                disabled={uploadLoading || !selectedExam || !newSubject.trim() || !csvFile}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                            >
                                {uploadLoading && (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                )}
                                {uploadLoading ? 'Adding New Subject...' : 'Add New Subject to Exam'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Available Exams Info */}
                {exams.length > 0 && (
                    <div className="mt-8 bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Available Base Exams</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {exams.map((exam) => (
                                <div key={exam._id} className="border border-gray-200 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-800 mb-2">{exam.examName}</h4>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <p>Subjects: {exam.subjects.map(subject => subject.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())).join(', ')}</p>
                                        <p>Total Questions: {exam.totalQuestions}</p>
                                        <div className="flex space-x-2">
                                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                                {exam.breakdown.basic} Basic
                                            </span>
                                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                                                {exam.breakdown.intermediate} Intermediate
                                            </span>
                                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                                                {exam.breakdown.advanced} Advanced
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AddNewSubjectToExam;
