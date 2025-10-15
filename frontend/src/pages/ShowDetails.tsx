import React from 'react';

interface Breakdown {
  basic: number;
  intermediate: number;
  advanced: number;
}

interface PracticeAreaDetail {
  practiceArea: string;
  totalQuestions: number;
  breakdown: Breakdown;
}

interface Exam {
  _id: string;
  examName: string;
  practiceAreas: string[];
  totalQuestions: number;
  breakdown: Breakdown;
  practiceAreaDetails: PracticeAreaDetail[];
  createdAt: string;
  updatedAt: string;
}

interface ShowDetailsProps {
  exam: Exam;
}

function ShowDetails({ exam }: ShowDetailsProps) {
  return (
    <div className="p-6 bg-gray-50">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">
                            Practice Area Details
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="min-w-full bg-white rounded-lg overflow-hidden">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    #
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Practice Area
                                  </th>
                                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Total
                                  </th>
                                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Basic
                                  </th>
                                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Intermediate
                                  </th>
                                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Advanced
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {exam.practiceAreaDetails.map((area, index) => (
                                  <tr
                                    key={index}
                                    className="hover:bg-gray-50 transition-colors"
                                  >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {index + 1}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                      {area.practiceArea}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-gray-900">
                                      {area.totalQuestions}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-700">
                                      {area.breakdown.basic}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-yellow-700">
                                      {area.breakdown.intermediate}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-red-700">
                                      {area.breakdown.advanced}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
  )
}

export default ShowDetails