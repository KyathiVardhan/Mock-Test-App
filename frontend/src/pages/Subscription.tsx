import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Check, Crown, Zap, Star, BadgePlus } from 'lucide-react';

export default function Subscription() {
  const { user, updateSubscription } = useAuth();

  const plans = [
    {
      name: 'Free',
      price: '₹0',
      billing: 'forever',
      icon: Zap,
      current: user?.subscription === 'free',
      features: [
        '5 tests per month',
        'Basic question explanations',
        'Limited practice areas',
      ],
      limitations: [
        'No detailed analytics',
        'No practice mode',
        'Limited explanations'
      ]
    },
    {
      name: 'Add On',
      price: '₹99',
      billing: 'as pre requirment',
      icon: BadgePlus,
      current: user?.subscription === 'add on',
      features: [
        '5 tests only',
        'No fixed time period',
        'Basic question explanations',
        'Limited practice areas',
      ],
      limitations: [
        'No detailed analytics',
        'No practice mode',
        'Limited explanations'
      ]

    },
    {
      name: 'Pro',
      price: '₹499',
      billing: 'per month',
      icon: Star,
      current: user?.subscription === 'pro',
      popular: true,
      features: [
        '25 tests per month',
        'Detailed explanations',
        'All practice areas',
        'Performance analytics',
      ],
      limitations: []
    },
    {
      name: 'Premium',
      price: '₹999',
      billing: 'per month',
      icon: Crown,
      current: user?.subscription === 'premium',
      features: [
        '50 tests per month',
        'Expert-level explanations',
        'All practice areas',
        'Advanced analytics',
        'Certificate programs',
        'Early access to new content'
      ],
      limitations: []
    }
  ];

  const handleUpgrade = (plan: 'free' | 'pro' | 'premium') => {
    updateSubscription(plan);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Unlock your full potential with our comprehensive legal education platform. 
          Choose the plan that best fits your learning needs.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-8 mb-12">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-200 hover:shadow-xl ${
              plan.popular 
                ? 'border-blue-500 transform scale-105' 
                : plan.current 
                  ? 'border-green-500' 
                  : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
              </div>
            )}

            {plan.current && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                  Current Plan
                </div>
              </div>
            )}

            <div className="p-8">
              <div className="flex items-center mb-4">
                <div className={`p-3 rounded-xl mr-4 ${
                  plan.name === 'Premium' 
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-400' 
                    : plan.name === 'Pro'
                      ? 'bg-blue-100'
                      : 'bg-gray-100'
                }`}>
                  <plan.icon className={`h-8 w-8 ${
                    plan.name === 'Premium' 
                      ? 'text-white' 
                      : plan.name === 'Pro'
                        ? 'text-blue-600'
                        : 'text-gray-600'
                  }`} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600 ml-2">/{plan.billing}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(plan.name.toLowerCase() as 'free' | 'pro' | 'premium')}
                disabled={plan.current}
                className={`w-full py-3 px-6 rounded-xl font-semibold transition-colors ${
                  plan.current
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : plan.name === 'Premium'
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white'
                      : plan.name === 'Pro'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                {plan.current ? 'Current Plan' : `Upgrade to ${plan.name}`}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Feature Comparison */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-8 py-6 bg-gray-50 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Feature Comparison</h2>
        </div>
        
        <div className="p-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Features</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">Free</th>
                  <th className='text-center py-3 px-4 font-semibold text-gray-900'>Add On</th>
                  <th className="text-center py-3 px-4 font-semibold text-blue-600">Pro</th>
                  <th className="text-center py-3 px-4 font-semibold text-yellow-600">Premium</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  ['Tests per month', '5', '5', '25', '50'],
                  ['Practice areas', 'Limited', 'Limited', 'All areas', 'All areas'],
                  ['Detailed explanations', '✗', '✓', '✓', '✓'],
                  ['Performance analytics', '✗', '✓', '✓', 'Advanced'],
                  ['Practice mode', '✗', '✓', '✓', '✓'],
                  // ['Custom study plans', '✗', '✗', '✓'],
                  // ['Tutoring sessions', '✗', '✗', '✓'],
                  // ['Mobile app', '✗', '✓', '✓'],
                  ['Early access to new content', '✗', '✗', '✓', '✓']
                ].map(([feature, free, AddOn, pro, premium], index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-4 px-4 font-medium text-gray-900">{feature}</td>
                    <td className="py-4 px-4 text-center text-gray-600">{free}</td>
                    <td className='py-4 px-4 text-center text-gray-600'>{AddOn}</td>
                    <td className="py-4 px-4 text-center text-blue-600">{pro}</td>
                    <td className="py-4 px-4 text-center text-yellow-600">{premium}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Frequently Asked Questions
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          {[
            {
              question: "Can I change my plan anytime?",
              answer: "Yes, you can upgrade your plan at any time. Changes will be reflected in your next billing cycle."
            },
            {
              question: "What payment methods do you accept?",
              answer: "We accept all major credit cards including Visa, MasterCard, American Express, and Discover."
            },
            {
              question: "Is there a money-back guarantee?",
              answer: "Yes, we offer a 30-day money-back guarantee. If you're not satisfied, contact us for a full refund."
            },
            {
              question: "Do you offer student discounts?",
              answer: "Yes, we offer 50% off for verified students. Contact support with your student ID for the discount code."
            }
          ].map((faq, index) => (
            <div key={index} className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
              <p className="text-gray-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}