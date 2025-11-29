"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/navbar";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import dayjs, { Dayjs } from 'dayjs';

interface Employee {
  id: number;
  name: string;
}

const serviceTypes = [
  "Oil Change",
  "Tire Rotation",
  "Brake Service",
  "Engine Diagnostic",
  "Transmission Service",
  "AC Repair",
];

export default function Scheduler() {
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [selectedTime, setSelectedTime] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [carInfo, setCarInfo] = useState("");
  const [email, setEmail] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingEmployees, setFetchingEmployees] = useState(true);

  const timeSlots = [
    "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM",
    "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM"
  ];

  //Fetch employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      const data = await response.json();
      
      if (response.ok) {
        setEmployees(data.employees);
      } else {
        console.error('Error fetching employees:', data.error);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setFetchingEmployees(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmation(true);
  };

  const confirmAppointment = async () => {
    setLoading(true);
    try {
      const appointmentData = {
        date: selectedDate?.format('YYYY-MM-DD'),
        time: selectedTime,
        phoneNumber,
        employeeId: parseInt(selectedEmployee),
        serviceType: selectedService,
        car: carInfo,
        email: email || `guest-${Date.now()}@example.com`
      };

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });

      const result = await response.json();

      if (response.ok) {
        alert("Appointment scheduled successfully! A $10 fee will be charged.");
        setShowConfirmation(false);
        //Reset form
        setSelectedDate(dayjs());
        setSelectedTime("");
        setPhoneNumber("");
        setSelectedEmployee("");
        setSelectedService("");
        setCarInfo("");
        setEmail("");
      } else {
        throw new Error(result.error || 'Failed to schedule appointment');
      }
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      alert(`Error scheduling appointment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  //Disable past dates
  const shouldDisableDate = (date: Dayjs) => {
    return date.isBefore(dayjs(), 'day');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-200">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-stone-900 text-center mb-2">
          Schedule Your Service
        </h1>
        <p className="text-lg text-stone-600 text-center mb-8">
          Book an appointment with our expert technicians
        </p>

        <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Calendar Section */}
            <div>
              <h2 className="text-2xl font-semibold text-stone-800 mb-4">Select Date & Time</h2>
              
              {/* Calendar */}
              <div className="mb-6">
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DateCalendar
                    value={selectedDate}
                    onChange={(newValue) => setSelectedDate(newValue)}
                    shouldDisableDate={shouldDisableDate}
                    sx={{
                      width: '100%',
                      '& .MuiPickersDay-root': {
                        '&.Mui-selected': {
                          backgroundColor: '#1c1917',
                          color: 'white',
                        },
                        '&:hover': {
                          backgroundColor: '#f5f5f4',
                        },
                      },
                      '& .MuiPickersDay-today': {
                        border: '1px solid #1c1917',
                      },
                    }}
                  />
                </LocalizationProvider>
              </div>

              {/* Selected Date Display */}
              {selectedDate && (
                <div className="mb-4 p-4 bg-stone-50 rounded-lg border border-stone-200">
                  <p className="text-stone-700">
                    <span className="font-semibold">Selected Date:</span>{' '}
                    {selectedDate.format('dddd, MMMM D, YYYY')}
                  </p>
                </div>
              )}

              {/* Time Selection */}
              {selectedDate && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-stone-800 mb-3">Select Time</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map(time => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedTime === time
                            ? "border-stone-900 bg-stone-900 text-white"
                            : "border-stone-300 hover:border-stone-400"
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Service Details Section */}
            <div>
              <h2 className="text-2xl font-semibold text-stone-800 mb-4">Service Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500"
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Preferred Employee
                  </label>
                  <select
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500"
                    required
                    disabled={fetchingEmployees}
                  >
                    <option value="">{fetchingEmployees ? "Loading technicians..." : "Select a technician"}</option>
                    {employees.map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Service Type
                  </label>
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500"
                    required
                  >
                    <option value="">Select a service</option>
                    {serviceTypes.map(service => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Vehicle Information
                  </label>
                  <input
                    type="text"
                    value={carInfo}
                    onChange={(e) => setCarInfo(e.target.value)}
                    className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500"
                    placeholder="e.g., 2020 Toyota Camry - License Plate ABC123"
                    required
                  />
                </div>

                <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
                  <div className="flex justify-between items-center">
                    <span className="text-stone-700">Service Fee</span>
                    <span className="text-lg font-semibold text-stone-900">$10.00</span>
                  </div>
                  <p className="text-sm text-stone-500 mt-2">
                    This fee reserves your appointment time and will be applied toward your service.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={!selectedDate || !selectedTime || !phoneNumber || !selectedEmployee || !selectedService || !carInfo || !email || loading}
                  className="w-full py-4 bg-stone-900 text-white rounded-xl text-lg font-semibold hover:bg-black transition disabled:bg-stone-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Scheduling...
                    </>
                  ) : (
                    "Schedule Appointment"
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-2xl font-bold text-stone-900 mb-4">
              Confirm Appointment
            </h3>
            
            <div className="space-y-3 mb-6">
              <p><strong>Date:</strong> {selectedDate?.format('dddd, MMMM D, YYYY')}</p>
              <p><strong>Time:</strong> {selectedTime}</p>
              <p><strong>Technician:</strong> {employees.find(e => e.id === parseInt(selectedEmployee))?.name}</p>
              <p><strong>Service:</strong> {selectedService}</p>
              <p><strong>Vehicle:</strong> {carInfo}</p>
              <p><strong>Phone:</strong> {phoneNumber}</p>
              <p><strong>Email:</strong> {email}</p>
              <div className="border-t pt-3">
                <p className="text-lg font-semibold">
                  Total Due: <span className="text-stone-900">$10.00</span>
                </p>
              </div>
            </div>

            <p className="text-stone-600 mb-6">
              A $10 fee will be charged to reserve your appointment. This amount will be applied to your final service bill.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 py-3 border border-stone-300 text-stone-700 rounded-xl hover:bg-stone-50 transition"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={confirmAppointment}
                className="flex-1 py-3 bg-stone-900 text-white rounded-xl hover:bg-black transition flex items-center justify-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  "Confirm & Pay $10"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}