"use client";

import { useState, useEffect } from 'react';
import { XMarkIcon, UserIcon, EnvelopeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: {
    id: number;
    make: string;
    model: string;
    year: number;
    price?: number;
  };
}

export default function PurchaseModal({ isOpen, onClose, car }: PurchaseModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter a sales representative email');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/sales-rep/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Invalid sales representative email');
        return;
      }

      if (!data.isSalesRep) {
        setError('This email does not belong to a sales representative');
        return;
      }

      // Success - redirect to purchase page with car and sales rep info
      window.location.href = `/purchase?id=${car.id}&salesRepId=${data.user.id}&salesRepEmail=${encodeURIComponent(data.user.email)}&make=${encodeURIComponent(car.make)}&model=${encodeURIComponent(car.model)}&year=${car.year}`;
      
    } catch (error) {
      console.error('Error validating sales rep:', error);
      setError('Failed to validate sales representative. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all w-full max-w-md">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          {/* Modal content */}
          <div className="p-6">
            {/* Header */}
            <div className="mb-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <UserIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mt-4 text-2xl font-bold text-gray-900 text-center">
                Sales Representative Required
              </h3>
              <p className="mt-2 text-sm text-gray-600 text-center">
                Please enter the email of your sales representative to proceed with the purchase.
              </p>
            </div>

            {/* Car info - NOW SHOWING CAR ID */}
            <div className="mb-6 rounded-lg bg-gray-50 p-4">
              <h4 className="font-semibold text-gray-900">Car Details</h4>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {car.year} {car.make} {car.model}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Car ID:</span>
                  <span className="font-semibold text-gray-900 ml-2">{car.id}</span>
                </div>
                {car.price && (
                  <div>
                    <span className="text-gray-600">Price:</span>
                    <span className="font-semibold text-blue-600 ml-2">
                      ${car.price.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Email Input Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sales Representative Email
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sales.rep@dealership.com"
                    className="block w-full rounded-lg border border-gray-300 pl-10 pr-3 py-3 focus:border-blue-500 focus:ring-blue-500"
                    disabled={isLoading}
                    required
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Enter the email address of your assigned sales representative.
                  You cannot purchase a car without a sales representative.
                </p>
              </div>

              {/* Error message */}
              {error && (
                <div className="rounded-lg bg-red-50 p-4">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-4 w-4 mr-2 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Validating...
                    </span>
                  ) : 'Continue to Purchase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}