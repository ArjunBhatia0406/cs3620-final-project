"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/navbar";

//Car interface
interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  condition: string;
  fuel_type: string;
  transmission: string;
  city: string;
  state: string;
  mpg: number;
  horse_power: number;
  safety_rating: number;
}

//Warranty interface
interface Warranty {
  id: number;
  car_id: number;
  coverage_years: number;
  price: number;
}

//Feature Bundle interface
interface FeatureBundle {
  id: number;
  car_id: number;
  description: string;
  price: number;
}

//Maintenance History interface
interface MaintenanceHistory {
  id: number;
  car_id: number;
  repairs: string;
}

//Sales Info interface
interface SalesInfo {
  id: number;
  car_id: number;
  discount: number;
}

export default function PurchasePage() {
  //State variables
  const router = useRouter();
  const searchParams = useSearchParams();
  const carId = searchParams.get("id");
  
  const [car, setCar] = useState<Car | null>(null);
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [featureBundles, setFeatureBundles] = useState<FeatureBundle[]>([]);
  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceHistory[]>([]);
  const [salesInfo, setSalesInfo] = useState<SalesInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWarranty, setSelectedWarranty] = useState<number | null>(null);
  const [selectedFeatureBundle, setSelectedFeatureBundle] = useState<number | null>(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [processingPurchase, setProcessingPurchase] = useState(false);
  const [customerEmail, setCustomerEmail] = useState("");
  const [discount, setDiscount] = useState(0);
  const [basePrice, setBasePrice] = useState(0);

  //Fetch car details on load
  useEffect(() => {
    if (!carId) {
      router.push("/find-a-car");
      return;
    }

    fetchCarDetails();
  }, [carId]);

  const fetchCarDetails = async () => {
    setLoading(true);
    try {
      //Fetch car details
      const carResponse = await fetch(`/api/cars/${carId}`);
      const carData = await carResponse.json();

      if (carData.success) {
        setCar(carData.car);
        const carBasePrice = Number(carData.car?.price) || 0;
        setBasePrice(carBasePrice);

        //Fetch warranties
        const warrantyResponse = await fetch(`/api/cars/${carId}/warranties`);
        const warrantyData = await warrantyResponse.json();
        setWarranties(warrantyData.warranties || []);

        //Fetch feature bundles
        const featuresResponse = await fetch(`/api/cars/${carId}/features`);
        const featuresData = await featuresResponse.json();
        setFeatureBundles(featuresData.features || []);

        //Fetch maintenance history
        const maintenanceResponse = await fetch(`/api/cars/${carId}/maintenance`);
        const maintenanceData = await maintenanceResponse.json();
        setMaintenanceHistory(maintenanceData.history || []);

        //Fetch sales info if exists
        const salesResponse = await fetch(`/api/cars/${carId}/sales`);
        const salesData = await salesResponse.json();
        setSalesInfo(salesData.sales || null);

        //Apply discount if exists
        if (salesData.sales?.discount) {
          setDiscount(salesData.sales.discount);
        }
      } else {
        console.error('Error fetching car:', carData.error);
      }
    } catch (error) {
      console.error("Error fetching car details:", error);
    } finally {
      setLoading(false);
    }
  };

  //Helper function to calculate discount amount
  const calculateDiscountAmount = (): number => {
    let subtotal = Number(basePrice) || 0;

    if (selectedWarranty) {
      const warranty = warranties.find(w => w.id === selectedWarranty);
      if (warranty && warranty.price) {
        subtotal += Number(warranty.price) || 0;
      }
    }

    if (selectedFeatureBundle) {
      const featureBundle = featureBundles.find(f => f.id === selectedFeatureBundle);
      if (featureBundle && featureBundle.price) {
        subtotal += Number(featureBundle.price) || 0;
      }
    }

    const discountValue = Number(discount) || 0;
    if (discountValue > 0 && subtotal > 0) {
      return (subtotal * discountValue) / 100;
    }

    return 0;
  };

  //Calculate total price whenever selections change
  useEffect(() => {
    if (!car) return;

    let calculatedTotal = basePrice;

    //Add selected warranty price (if any selected)
    if (selectedWarranty) {
      const warranty = warranties.find(w => w.id === selectedWarranty);
      if (warranty && warranty.price) {
        calculatedTotal += Number(warranty.price);
      }
    }

    //Add selected feature bundle price (if any selected)
    if (selectedFeatureBundle) {
      const featureBundle = featureBundles.find(f => f.id === selectedFeatureBundle);
      if (featureBundle && featureBundle.price) {
        calculatedTotal += Number(featureBundle.price);
      }
    }

    //Apply discount if any
    if (discount > 0) {
      const discount_temp = Number(discount) / 100;
      calculatedTotal = calculatedTotal * (1 - discount_temp);
    }

    setTotalPrice(calculatedTotal);
  }, [car, basePrice, selectedWarranty, selectedFeatureBundle, warranties, featureBundles, discount]);

  //Handle purchase confirmation
  const handlePurchase = async () => {
    if (!car || !customerEmail) {
      alert("Please fill in all required fields");
      return;
    }

    setProcessingPurchase(true);
    try {
      const purchaseData = {
        car_id: car.id,
        customer_email: customerEmail,
        total_amount: totalPrice,
        warranty_id: selectedWarranty,
        feature_bundle_id: selectedFeatureBundle,
        discount: discount
      };

      //Send purchase data to backend
      const response = await fetch("/api/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(purchaseData),
      });

      const result = await response.json();

      if (result.success) {
        alert("Purchase successful! Your transaction ID is: " + result.transactionId);
        router.push("/");
      } else {
        alert("Purchase failed: " + result.error);
      }
    } catch (error) {
      console.error("Error processing purchase:", error);
      alert("An error occurred during purchase");
    } finally {
      setProcessingPurchase(false);
    }
  };

  //Handle deselecting warranty
  const handleWarrantyClick = (warrantyId: number) => {
    if (selectedWarranty === warrantyId) {
      //If clicking the already selected warranty, deselect it
      setSelectedWarranty(null);
    } else {
      //Select the new warranty
      setSelectedWarranty(warrantyId);
    }
  };

  //Handle deselecting feature bundle
  const handleFeatureBundleClick = (bundleId: number) => {
    if (selectedFeatureBundle === bundleId) {
      //If clicking the already selected bundle, deselect it
      setSelectedFeatureBundle(null);
    } else {
      //Select the new bundle
      setSelectedFeatureBundle(bundleId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-200">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading car details...</p>
        </div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-200">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Car Not Found</h2>
          <p className="text-gray-600 mb-6">The car you're looking for doesn't exist or is no longer available.</p>
          <button
            onClick={() => router.push("/find-a-car")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Browse Available Cars
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-200">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Complete Your Purchase
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Review the car details, select additional options, and complete your purchase.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Car Details & Customer Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Car Details Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Car Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {car.year} {car.make} {car.model}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Car ID</p>
                      <p className="font-medium">CAR-{car.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Condition</p>
                      <p className="font-medium capitalize">{car.condition}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium">{car.city}, {car.state}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Base Price</p>
                    <p className="text-3xl font-bold text-blue-600">${basePrice.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fuel Type</p>
                    <p className="font-medium">{car.fuel_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Transmission</p>
                    <p className="font-medium">{car.transmission}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-gray-500">MPG</p>
                      <p className="font-medium">{car.mpg}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Horsepower</p>
                      <p className="font-medium">{car.horse_power} HP</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Safety Rating</p>
                      <p className="font-medium">{car.safety_rating}/5.0</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Warranty Options */}
            {warranties.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Warranty Options</h2>
                <div className="space-y-4">
                  {/* "No Warranty" option */}
                  <div
                    className={`p-4 border rounded-lg cursor-pointer transition ${!selectedWarranty ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                    onClick={() => setSelectedWarranty(null)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-gray-900">No Additional Warranty</h3>
                        <p className="text-sm text-gray-600">Standard manufacturer warranty only</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">$0</p>
                        {!selectedWarranty && (
                          <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                            Selected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {warranties.map((warranty) => (
                    <div
                      key={warranty.id}
                      className={`p-4 border rounded-lg cursor-pointer transition ${selectedWarranty === warranty.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                      onClick={() => handleWarrantyClick(warranty.id)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {warranty.coverage_years} Year Extended Warranty
                          </h3>
                          <p className="text-sm text-gray-600">
                            Comprehensive coverage for {warranty.coverage_years} years
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-600">
                            ${warranty.price?.toLocaleString() || "0"}
                          </p>
                          {selectedWarranty === warranty.id && (
                            <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                              Selected
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feature Bundles */}
            {featureBundles.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Feature Bundles</h2>
                <div className="space-y-4">
                  {/* "No Feature Bundle" option */}
                  <div
                    className={`p-4 border rounded-lg cursor-pointer transition ${!selectedFeatureBundle ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                    onClick={() => setSelectedFeatureBundle(null)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-gray-900">No Additional Features</h3>
                        <p className="text-sm text-gray-600">Standard features only</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">$0</p>
                        {!selectedFeatureBundle && (
                          <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                            Selected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {featureBundles.map((bundle) => (
                    <div
                      key={bundle.id}
                      className={`p-4 border rounded-lg cursor-pointer transition ${selectedFeatureBundle === bundle.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                      onClick={() => handleFeatureBundleClick(bundle.id)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-gray-900">Feature Bundle</h3>
                          <p className="text-sm text-gray-600">{bundle.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-600">
                            ${bundle.price?.toLocaleString() || "0"}
                          </p>
                          {selectedFeatureBundle === bundle.id && (
                            <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                              Selected
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Maintenance History */}
            {maintenanceHistory.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Maintenance History</h2>
                <div className="space-y-4">
                  {maintenanceHistory.map((record) => (
                    <div key={record.id} className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Repair Record</h4>
                      <p className="text-gray-600">{record.repairs}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sales Information */}
            {salesInfo && salesInfo.discount > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Special Offer</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <span className="text-2xl font-bold text-green-600 mr-3">
                      {salesInfo.discount}% OFF
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">Discount Applied</p>
                      <p className="text-sm text-gray-600">
                        Special promotion available for this vehicle
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Purchase Summary & Customer Info */}
          <div className="space-y-8">
            {/* Purchase Summary */}
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Purchase Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">Base Price</p>
                  <p className="font-medium">${basePrice.toLocaleString()}</p>
                </div>

                {selectedWarranty && (
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600">Extended Warranty</p>
                    <p className="font-medium">
                      +${warranties.find(w => w.id === selectedWarranty)?.price?.toLocaleString() || "0"}
                    </p>
                  </div>
                )}

                {!selectedWarranty && warranties.length > 0 && (
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600">Warranty</p>
                    <p className="font-medium">$0</p>
                  </div>
                )}

                {selectedFeatureBundle && (
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600">Feature Bundle</p>
                    <p className="font-medium">
                      +${featureBundles.find(f => f.id === selectedFeatureBundle)?.price?.toLocaleString() || "0"}
                    </p>
                  </div>
                )}

                {!selectedFeatureBundle && featureBundles.length > 0 && (
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600">Feature Bundle</p>
                    <p className="font-medium">$0</p>
                  </div>
                )}

                {discount > 0 && (
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600">Discount ({discount}%)</p>
                    <p className="font-medium text-green-600">
                      -${calculateDiscountAmount().toFixed(2)}
                    </p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <p className="text-lg font-semibold text-gray-900">Total Amount</p>
                    <p className="text-2xl font-bold text-blue-600">${Math.round(totalPrice * 100) / 100}</p>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="space-y-4 mb-6">
                <h3 className="font-semibold text-gray-900">Customer Information</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>

              {/* Confirm Purchase Button */}
              <button
                onClick={handlePurchase}
                disabled={processingPurchase || !customerEmail}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold text-lg rounded-lg hover:from-green-700 hover:to-green-800 transition duration-300 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed"
              >
                {processingPurchase ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing Purchase...
                  </span>
                ) : (
                  `Confirm Purchase - $${typeof totalPrice === 'number' ? totalPrice.toFixed(2) : '0.00'}`
                )}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                By clicking "Confirm Purchase", you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}