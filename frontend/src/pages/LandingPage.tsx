import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Users, Award, BookOpen, ArrowRight, Star } from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      icon: BookOpen,
      title: 'Comprehensive Test Library',
      description: 'Access thousands of questions across all legal specializations'
    },
    {
      icon: Award,
      title: 'Professional Certification',
      description: 'Prepare for bar exams and professional legal certifications'
    },
    {
      icon: Users,
      title: 'Expert-Crafted Content',
      description: 'Questions written by experienced legal professionals'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Corporate Lawyer',
      content: 'LegalMock helped me pass my bar exam with confidence. The questions are incredibly realistic.',
      rating: 5
    },
    {
      name: 'Michael Torres',
      role: 'Criminal Defense Attorney',
      content: 'The best legal test prep platform I\'ve used. Highly recommend for any legal professional.',
      rating: 5
    },
    {
      name: 'Emily Rodriguez',
      role: 'Family Law Attorney',
      content: 'Excellent resource for staying sharp and preparing for certifications.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-black mb-6">
              Master Your Legal
              <span className="text-[#d5a661]"> Career</span>
            </h1>
            <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
              Prepare for bar exams, certifications, and advance your legal career with our comprehensive mock test platform designed specifically for legal professionals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-[#d5a661] text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-amber-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Start Free Trial
              </Link>
              <Link
                to="/login"
                className="bg-white text-[#d5a661] border-2 border-[#d5a661] px-8 py-4 rounded-lg text-lg font-semibold hover:bg-amber-50 transition-colors flex items-center"
              >
                Sign In
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose LegalMock?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built by legal professionals, for legal professionals. Get the edge you need to succeed.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-8 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors">
                <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Specializations Section */}
      <section className="py-20 bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Legal Specializations
            </h2>
            <p className="text-xl text-gray-700">
              Practice tests for all major areas of law
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6">
            {[
              'Constitutional Law',
              'Criminal Law',
              'Corporate Law',
              'Family Law',
              'Immigration Law',
              'Tax Law',
              'Employment Law',
              'Intellectual Property'
            ].map((specialty, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-amber-100">
                <div className="flex items-center mb-3">
                  <CheckCircle className="h-5 w-5 text-amber-600 mr-2" />
                  <h3 className="font-semibold text-gray-900">{specialty}</h3>
                </div>
                <p className="text-sm text-gray-600">Comprehensive practice questions and explanations</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Trusted by Legal Professionals
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gradient-to-br from-amber-50 to-orange-50 p-8 rounded-xl border border-amber-100">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-amber-500 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-amber-700">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#3C222F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Advance Your Legal Career?
          </h2>
          <p className="text-xl text-amber-100 mb-8 max-w-2xl mx-auto">
            Join thousands of legal professionals who trust LegalMock for their certification and career advancement.
          </p>
          <Link
            to="/register"
            className="bg-white text-amber-700 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-amber-50 transition-colors inline-flex items-center shadow-lg"
          >
            Get Started Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
