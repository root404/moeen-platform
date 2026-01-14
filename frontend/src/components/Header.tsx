'use client';

import React, { useState } from 'react';
import Button from './Button';
import Link from 'next/link';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b border-emerald-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center ml-3">
                <span className="text-white font-bold text-lg">م</span>
              </div>
              <div className="mr-3">
                <h1 className="text-xl font-bold text-emerald-700">مُعين</h1>
                <p className="text-xs text-gray-500 hidden sm:inline">منصة حفظ وتقييم القرآن</p>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-reverse space-x-6">
            <Link href="/features" className="text-gray-700 hover:text-emerald-600 transition-colors font-medium">
              المميزات
            </Link>
            <Link href="/pricing" className="text-gray-700 hover:text-emerald-600 transition-colors font-medium">
              الأسعار
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-emerald-600 transition-colors font-medium">
              من نحن
            </Link>
            <Button variant="outline" size="sm" className="ml-4">
              تسجيل الدخول
            </Button>
            <Button size="sm" className="mr-2">
              ابدأ الآن
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-emerald-50 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="القائمة"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <nav className="px-2 py-3 space-y-1">
              <Link
                href="/features"
                className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                المميزات
              </Link>
              <Link
                href="/pricing"
                className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                الأسعار
              </Link>
              <Link
                href="/about"
                className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                من نحن
              </Link>
              <div className="pt-2 mt-2 border-t border-gray-200">
                <Button variant="outline" size="sm" className="w-full mb-2">
                  تسجيل الدخول
                </Button>
                <Button size="sm" className="w-full">
                  ابدأ الآن
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}