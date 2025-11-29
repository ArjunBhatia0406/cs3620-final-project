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

interface Appointment {
  id: number;
  date: string;
  employee_id: number;
  service_type: string;
  car: string;
  phone_number: string;
  employee_name: string;
  user_email: string;
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

  const [viewAppointmentsMode, setViewAppointmentsMode] = useState(false);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [fetchingAppointments, setFetchingAppointments] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [editFormData, setEditFormData] = useState({
    date: "",
    time: "",
    employeeId: "",
    serviceType: "",
    car: "",
    phoneNumber: ""
  });
  const [filterEmail, setFilterEmail] = useState("");

  const timeSlots = [
    "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM",
    "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM"
  ];

  //Fetch employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  //Filter appointments when filterEmail changes
  useEffect(() => {
    if (filterEmail) {
      const filtered = allAppointments.filter(appointment => 
        appointment.user_email.toLowerCase().includes(filterEmail.toLowerCase())
      );
      setFilteredAppointments(filtered);
    } else {
      setFilteredAppointments(allAppointments);
    }
  }, [filterEmail, allAppointments]);

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
        email: email
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

  //Fetch all appointments
  const fetchAllAppointments = async () => {
    setFetchingAppointments(true);
    try {
      const response = await fetch(`/api/appointments/all`);
      const data = await response.json();

      if (response.ok) {
        setAllAppointments(data.appointments || []);
        setFilteredAppointments(data.appointments || []);
        setViewAppointmentsMode(true);
      } else {
        throw new Error(data.error || 'Failed to fetch appointments');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      alert(`Error fetching appointments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setFetchingAppointments(false);
    }
  };

  //Edit appointment
  const startEditAppointment = (appointment: Appointment) => {
    const appointmentDateTime = dayjs(appointment.date);
    setEditingAppointment(appointment);
    setEditFormData({
      date: appointmentDateTime.format('YYYY-MM-DD'),
      time: appointmentDateTime.format('hh:mm A'),
      employeeId: appointment.employee_id.toString(),
      serviceType: appointment.service_type,
      car: appointment.car,
      phoneNumber: appointment.phone_number
    });
  };

  //Update appointment
  const updateAppointment = async () => {
    if (!editingAppointment) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/appointments/${editingAppointment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editFormData,
          email: editingAppointment.user_email //Use the appointment's email for authorization
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert("Appointment updated successfully!");
        setEditingAppointment(null);
        fetchAllAppointments(); //Refresh the list
      } else {
        throw new Error(result.error || 'Failed to update appointment');
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert(`Error updating appointment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  //Delete appointment
  const deleteAppointment = async (appointmentId: number, appointmentEmail: string) => {
    if (!confirm("Are you sure you want to delete this appointment?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: appointmentEmail }),
      });

      const result = await response.json();

      if (response.ok) {
        alert("Appointment deleted successfully!");
        fetchAllAppointments(); //Refresh the list
      } else {
        throw new Error(result.error || 'Failed to delete appointment');
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert(`Error deleting appointment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
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

        {/* View All Appointments Button */}
        <div className="max-w-2xl mx-auto mb-8 bg-white rounded-2xl shadow-lg p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <h2 className="text-xl font-semibold text-stone-800">Manage Appointments</h2>
            <button
              onClick={fetchAllAppointments}
              disabled={fetchingAppointments}
              className="px-6 py-3 bg-stone-700 text-white rounded-lg hover:bg-stone-800 transition disabled:bg-stone-400 disabled:cursor-not-allowed"
            >
              {fetchingAppointments ? "Loading..." : "View All Appointments"}
            </button>
          </div>
        </div>

        {viewAppointmentsMode ? (
          //Appointments List View
          <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-stone-800">All Appointments</h2>
              <button
                onClick={() => setViewAppointmentsMode(false)}
                className="px-4 py-2 bg-stone-600 text-white rounded-lg hover:bg-stone-700 transition"
              >
                Schedule New Appointment
              </button>
            </div>

            {/* Filter Section */}
            <div className="mb-6 p-4 bg-stone-50 rounded-lg border border-stone-200">
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Filter by Email
              </label>
              <input
                type="email"
                value={filterEmail}
                onChange={(e) => setFilterEmail(e.target.value)}
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500"
                placeholder="example@gmail.com"
              />
            </div>

            {filteredAppointments.length === 0 ? (
              <div className="text-center py-8 text-stone-600">
                {allAppointments.length === 0 
                  ? "No appointments found" 
                  : `No appointments found for "${filterEmail}"`
                }
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAppointments.map((appointment) => (
                  <div key={appointment.id} className="border border-stone-300 rounded-lg p-4">
                    {editingAppointment?.id === appointment.id ? (
                      //Edit Form
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Edit Appointment</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Edit form fields */}
                          {/* Date Input */}
                          <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                              Date
                            </label>
                            <input
                              type="date"
                              value={editFormData.date}
                              onChange={(e) => setEditFormData(prev => ({ ...prev, date: e.target.value }))}
                              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500"
                              required
                            />
                          </div>

                          {/* Time Selection */}
                          <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                              Time
                            </label>
                            <select
                              value={editFormData.time}
                              onChange={(e) => setEditFormData(prev => ({ ...prev, time: e.target.value }))}
                              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500"
                              required
                            >
                              <option value="">Select a time</option>
                              {timeSlots.map(time => (
                                <option key={time} value={time}>{time}</option>
                              ))}
                            </select>
                          </div>

                          {/* Technician Selection */}
                          <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                              Technician
                            </label>
                            <select
                              value={editFormData.employeeId}
                              onChange={(e) => setEditFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500"
                              required
                            >
                              <option value="">Select a technician</option>
                              {employees.map(employee => (
                                <option key={employee.id} value={employee.id}>
                                  {employee.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Service Type */}
                          <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                              Service Type
                            </label>
                            <select
                              value={editFormData.serviceType}
                              onChange={(e) => setEditFormData(prev => ({ ...prev, serviceType: e.target.value }))}
                              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500"
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

                          {/* Vehicle Information */}
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                              Vehicle Information
                            </label>
                            <input
                              type="text"
                              value={editFormData.car}
                              onChange={(e) => setEditFormData(prev => ({ ...prev, car: e.target.value }))}
                              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500"
                              placeholder="e.g., 2020 Toyota Camry - License Plate ABC123"
                              required
                            />
                          </div>

                          {/* Phone Number */}
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              value={editFormData.phoneNumber}
                              onChange={(e) => setEditFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500"
                              placeholder="(555) 123-4567"
                              required
                            />
                          </div>
                        </div>
                        <div className="flex space-x-3">
                          <button
                            onClick={updateAppointment}
                            disabled={loading}
                            className="px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-black transition disabled:bg-stone-400 flex items-center"
                          >
                            {loading ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Updating...
                              </>
                            ) : (
                              "Save Changes"
                            )}
                          </button>
                          <button
                            onClick={() => setEditingAppointment(null)}
                            className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition"
                            disabled={loading}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      //Appointment Display
                      <div className="flex flex-col md:flex-row md:items-center justify-between">
                        <div className="space-y-2">
                          <p><strong>Email:</strong> {appointment.user_email}</p>
                          <p><strong>Date & Time:</strong> {dayjs(appointment.date).format('MMM D, YYYY h:mm A')}</p>
                          <p><strong>Service:</strong> {appointment.service_type}</p>
                          <p><strong>Technician:</strong> {appointment.employee_name}</p>
                          <p><strong>Vehicle:</strong> {appointment.car}</p>
                          <p><strong>Phone:</strong> {appointment.phone_number}</p>
                        </div>
                        <div className="flex space-x-2 mt-4 md:mt-0">
                          <button
                            onClick={() => startEditAppointment(appointment)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteAppointment(appointment.id, appointment.user_email)}
                            disabled={loading}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-red-400"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
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
      )}

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
    </div>
  );
}