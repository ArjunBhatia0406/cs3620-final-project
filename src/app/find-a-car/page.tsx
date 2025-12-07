"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/navbar";

//Define Car and FilterState
interface Car {
    id: number;
    make: string;
    model: string;
    year: number;
    origin: string;
    price: number;
    city: string;
    state: string;
    mpg: number;
    horse_power: number;
    acceleration: number;
    available: boolean;
    condition: string;
    fuel_type: string;
    transmission: string;
    safety_rating: number;
    blind_spot_decision: number;
    collision_warning: number;
}

interface FilterState {
    make: string;
    model: string;
    minYear: string;
    maxYear: string;
    minPrice: string;
    maxPrice: string;
    condition: string;
    fuelType: string;
    transmission: string;
    minSafetyRating: string;
    maxSafetyRating: string;
    minMpg: string;
    maxMpg: string;
    minHorsepower: string;
    maxHorsepower: string;
    minAcceleration: string;
    maxAcceleration: string;
    availableOnly: boolean;
}

export default function FindACar() {
    //State variables
    const [cars, setCars] = useState<Car[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalCars, setTotalCars] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [makes, setMakes] = useState<string[]>([]);
    const [models, setModels] = useState<string[]>([]);

    //Filters state
    const [filters, setFilters] = useState<FilterState>({
        make: "",
        model: "",
        minYear: "",
        maxYear: "",
        minPrice: "",
        maxPrice: "",
        condition: "",
        fuelType: "",
        transmission: "",
        minSafetyRating: "",
        maxSafetyRating: "",
        minMpg: "",
        maxMpg: "",
        minHorsepower: "",
        maxHorsepower: "",
        minAcceleration: "",
        maxAcceleration: "",
        availableOnly: true,
    });

    //Fetch unique makes and models on start
    useEffect(() => {
        fetchMakes();
    }, []);

    //Fetch makes from API
    const fetchMakes = async () => {
        try {
            const response = await fetch('/api/cars/makes');
            if (response.ok) {
                const data = await response.json();
                setMakes(data.makes || []);
            }
        } catch (error) {
            console.error('Error fetching makes:', error);
        }
    };

    //Fetch models based on selected make
    const fetchModels = async (make: string) => {
        if (!make) {
            console.log('No make selected, clearing models');
            setModels([]);
            return;
        }

        try {
            console.log(`Fetching models for make: "${make}"`);
            const response = await fetch(`/api/cars/models?make=${encodeURIComponent(make)}`);
            console.log('Response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('Models API response:', data);
                console.log(`Received ${data.models?.length || 0} models`);
                setModels(data.models || []);
            } else {
                console.error('API Error status:', response.status);
                const errorText = await response.text();
                console.error('API Error response:', errorText);
                setModels([]);
            }
        } catch (error) {
            console.error('Error fetching models:', error);
            setModels([]);
        }
    };

    //Search cars based on filters api
    const searchCars = async (page = 1) => {
        setLoading(true);
        try {
            //Build query string from filters
            const params = new URLSearchParams();

            Object.entries(filters).forEach(([key, value]) => {
                if (value !== "" && value !== false) {
                    params.append(key, value.toString());
                }
            });

            params.append('page', page.toString());
            params.append('limit', '12'); //Show 12 cars per page

            const response = await fetch(`/api/cars/search?${params.toString()}`);
            const data = await response.json();

            if (response.ok && data.success) {
                setCars(data.cars || []);
                setTotalCars(data.total || 0);
                setTotalPages(data.totalPages || 1);
                setCurrentPage(page);
            } else {
                console.error('Search failed:', data.error);
            }
        } catch (error) {
            console.error('Error searching cars:', error);
        } finally {
            setLoading(false);
        }
    };

    //Handle filter input changes
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        setFilters(prev => {
            const newFilters = {
                ...prev,
                [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
            };

            //If make changes, fetch models for that make
            if (name === 'make') {
                fetchModels(value);
                //Reset model when make changes
                newFilters.model = "";
            }

            return newFilters;
        });
    };

    //Handle search form submission
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        searchCars(1);
    };

    //Reset all filters
    const handleReset = () => {
        setFilters({
            make: "",
            model: "",
            minYear: "",
            maxYear: "",
            minPrice: "",
            maxPrice: "",
            condition: "",
            fuelType: "",
            transmission: "",
            minSafetyRating: "",
            maxSafetyRating: "",
            minMpg: "",
            maxMpg: "",
            minHorsepower: "",
            maxHorsepower: "",
            minAcceleration: "",
            maxAcceleration: "",
            availableOnly: true,
        });
        setModels([]);
        setCars([]);
        setTotalCars(0);
    };

    //Handle page changes
    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            searchCars(page);
        }
    };

    //Safety features description
    const getSafetyFeatures = (car: Car) => {
        const features = [];
        if (car.blind_spot_decision) features.push("Blind Spot Detection");
        if (car.collision_warning) features.push("Collision Warning");
        return features.length > 0 ? features.join(", ") : "Basic Safety";
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-200">
            <Navbar />

            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Find Your Perfect Car
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Use our advanced filters to find the car that matches all your preferences.
                        Search by safety ratings, performance stats, and more.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Filters Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Filters</h2>
                                <button
                                    onClick={handleReset}
                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    Reset All
                                </button>
                            </div>

                            <form onSubmit={handleSearch} className="space-y-6">
                                {/* Make & Model */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-gray-800">Brand & Model</h3>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Make
                                        </label>
                                        <select
                                            name="make"
                                            value={filters.make}
                                            onChange={handleFilterChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">All Makes</option>
                                            {makes.map(make => (
                                                <option key={make} value={make}>
                                                    {make}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Model
                                        </label>
                                        <select
                                            name="model"
                                            value={filters.model}
                                            onChange={handleFilterChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            disabled={!filters.make}
                                        >
                                            <option value="">All Models</option>
                                            {models.map(model => (
                                                <option key={model} value={model}>
                                                    {model}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Year Range */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-gray-800">Year</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Min Year
                                            </label>
                                            <input
                                                type="number"
                                                name="minYear"
                                                value={filters.minYear}
                                                onChange={handleFilterChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                placeholder="1970"
                                                min="1970"
                                                max="2024"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Max Year
                                            </label>
                                            <input
                                                type="number"
                                                name="maxYear"
                                                value={filters.maxYear}
                                                onChange={handleFilterChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                placeholder="2024"
                                                min="1970"
                                                max="2024"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Condition & Type */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-gray-800">Condition & Type</h3>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Condition
                                        </label>
                                        <select
                                            name="condition"
                                            value={filters.condition}
                                            onChange={handleFilterChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        >
                                            <option value="">Any Condition</option>
                                            <option value="New">New</option>
                                            <option value="Used - Excellent">Used - Excellent</option>
                                            <option value="Used - Good">Used - Good</option>
                                            <option value="Used - Fair">Used - Fair</option>
                                            <option value="Vintage">Vintage</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Fuel Type
                                        </label>
                                        <select
                                            name="fuelType"
                                            value={filters.fuelType}
                                            onChange={handleFilterChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        >
                                            <option value="">Any Fuel Type</option>
                                            <option value="Petrol">Petrol</option>
                                            <option value="Diesel">Diesel</option>
                                            <option value="Electric">Electric</option>
                                            <option value="Hybrid">Hybrid</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Transmission
                                        </label>
                                        <select
                                            name="transmission"
                                            value={filters.transmission}
                                            onChange={handleFilterChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        >
                                            <option value="">Any Transmission</option>
                                            <option value="Manual">Manual</option>
                                            <option value="Automatic">Automatic</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Safety Rating */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-gray-800">Safety Rating (1-5)</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Min Rating
                                            </label>
                                            <input
                                                type="number"
                                                name="minSafetyRating"
                                                value={filters.minSafetyRating}
                                                onChange={handleFilterChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                placeholder="1.0"
                                                min="1"
                                                max="5"
                                                step="0.1"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Max Rating
                                            </label>
                                            <input
                                                type="number"
                                                name="maxSafetyRating"
                                                value={filters.maxSafetyRating}
                                                onChange={handleFilterChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                placeholder="5.0"
                                                min="1"
                                                max="5"
                                                step="0.1"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Performance Stats */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-gray-800">Performance</h3>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            MPG Range
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="number"
                                                name="minMpg"
                                                value={filters.minMpg}
                                                onChange={handleFilterChange}
                                                className="px-3 py-2 border border-gray-300 rounded-lg"
                                                placeholder="Min"
                                                min="0"
                                            />
                                            <input
                                                type="number"
                                                name="maxMpg"
                                                value={filters.maxMpg}
                                                onChange={handleFilterChange}
                                                className="px-3 py-2 border border-gray-300 rounded-lg"
                                                placeholder="Max"
                                                min="0"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Horsepower (HP)
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="number"
                                                name="minHorsepower"
                                                value={filters.minHorsepower}
                                                onChange={handleFilterChange}
                                                className="px-3 py-2 border border-gray-300 rounded-lg"
                                                placeholder="Min"
                                                min="0"
                                            />
                                            <input
                                                type="number"
                                                name="maxHorsepower"
                                                value={filters.maxHorsepower}
                                                onChange={handleFilterChange}
                                                className="px-3 py-2 border border-gray-300 rounded-lg"
                                                placeholder="Max"
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Availability */}
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="availableOnly"
                                        checked={filters.availableOnly}
                                        onChange={handleFilterChange}
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <label className="ml-2 text-sm text-gray-700">
                                        Show Available Only
                                    </label>
                                </div>

                                {/* Search Button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-300 disabled:bg-blue-400 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Searching...
                                        </span>
                                    ) : (
                                        'Search Cars'
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Results Section */}
                    <div className="lg:col-span-3">
                        {/* Results Header */}
                        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Search Results</h2>
                                    <p className="text-gray-600">
                                        {totalCars === 0 ? 'No cars found' :
                                            `Found ${totalCars} car${totalCars !== 1 ? 's' : ''} matching your criteria`}
                                    </p>
                                </div>

                                {totalCars > 0 && (
                                    <div className="flex items-center space-x-4">
                                        <div className="text-sm text-gray-600">
                                            Page {currentPage} of {totalPages}
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                            >
                                                Previous
                                            </button>
                                            <button
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Loading State */}
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                <p className="mt-4 text-gray-600">Searching for your perfect car...</p>
                            </div>
                        ) : (
                            <>
                                {/* Results Grid */}
                                {cars.length === 0 ? (
                                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                                        <div className="text-gray-400 mb-4">
                                            <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No cars found</h3>
                                        <p className="text-gray-600 mb-6">
                                            Try adjusting your filters or search with different criteria.
                                        </p>
                                        <button
                                            onClick={handleReset}
                                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                        >
                                            Clear All Filters
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {cars.map((car, index) => (
                                            <div
                                                key={`${car.make}-${car.model}-${car.year}-${car.origin}-${index}`}
                                                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-100"
                                            >
                                                <div className="p-6">
                                                    {/* Car Header */}
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <h3 className="text-xl font-bold text-gray-900">
                                                                {car.year} {car.make} {car.model}
                                                            </h3>
                                                            <p className="text-gray-600">{car.origin}</p>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${car.available
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {car.available ? 'Available' : 'Sold'}
                                                        </span>
                                                    </div>

                                                    {/* Key Specs Grid */}
                                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                                        <div>
                                                            <p className="text-sm text-gray-500">Condition</p>
                                                            <p className="font-medium capitalize">{car.condition || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-500">Fuel Type</p>
                                                            <p className="font-medium">{car.fuel_type || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-500">Transmission</p>
                                                            <p className="font-medium">{car.transmission || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-500">Location</p>
                                                            <p className="font-medium">{car.city}, {car.state}</p>
                                                        </div>
                                                    </div>

                                                    {/* Safety Rating */}
                                                    <div className="mb-4">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <p className="text-sm text-gray-500">Safety Rating</p>
                                                            <span className="font-bold text-gray-900">
                                                                {(typeof car.safety_rating === 'number'
                                                                    ? car.safety_rating
                                                                    : parseFloat(car.safety_rating || '0')).toFixed(1)}/5.0
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <div className="text-yellow-400 text-lg">
                                                                {'★'.repeat(Math.floor(car.safety_rating || 0))}
                                                                {'☆'.repeat(5 - Math.floor(car.safety_rating || 0))}
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {getSafetyFeatures(car)}
                                                        </p>
                                                    </div>

                                                    {/* Performance Stats */}
                                                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                                        <h4 className="font-semibold text-gray-800 mb-2">Performance</h4>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            <div className="text-center">
                                                                <p className="text-2xl font-bold text-blue-600">{car.mpg || 'N/A'}</p>
                                                                <p className="text-xs text-gray-600">MPG</p>
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-2xl font-bold text-blue-600">{car.horse_power || 'N/A'}</p>
                                                                <p className="text-xs text-gray-600">HP</p>
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-2xl font-bold text-blue-600">
                                                                    {(() => {
                                                                        const acc = car.acceleration;
                                                                        if (acc === null || acc === undefined) return 'N/A';
                                                                        const numAcc = typeof acc === 'number' ? acc : parseFloat(acc);
                                                                        return isNaN(numAcc) ? 'N/A' : numAcc.toFixed(1);
                                                                    })()}
                                                                </p>
                                                                <p className="text-xs text-gray-600">0-60s</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Action Button */}
                                                    <button
                                                        onClick={() => {
                                                            //Navigate to purchase page or show details
                                                            window.location.href = `/purchase?id=${car.id}`;
                                                        }}
                                                        disabled={!car.available}
                                                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition duration-300 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed"
                                                    >
                                                        {car.available ? 'View Details & Purchase' : 'Not Available'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Pages */}
                                {totalPages > 1 && (
                                    <div className="mt-8 flex justify-center">
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handlePageChange(1)}
                                                disabled={currentPage === 1}
                                                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                                            >
                                                First
                                            </button>
                                            <button
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                                            >
                                                Previous
                                            </button>

                                            <div className="flex items-center space-x-1">
                                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                    let pageNum;
                                                    if (totalPages <= 5) {
                                                        pageNum = i + 1;
                                                    } else if (currentPage <= 3) {
                                                        pageNum = i + 1;
                                                    } else if (currentPage >= totalPages - 2) {
                                                        pageNum = totalPages - 4 + i;
                                                    } else {
                                                        pageNum = currentPage - 2 + i;
                                                    }

                                                    return (
                                                        <button
                                                            key={pageNum}
                                                            onClick={() => handlePageChange(pageNum)}
                                                            className={`px-4 py-2 rounded-lg ${currentPage === pageNum
                                                                ? 'bg-blue-600 text-white'
                                                                : 'border border-gray-300 hover:bg-gray-50'
                                                                }`}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            <button
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                                            >
                                                Next
                                            </button>
                                            <button
                                                onClick={() => handlePageChange(totalPages)}
                                                disabled={currentPage === totalPages}
                                                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                                            >
                                                Last
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}