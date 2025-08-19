'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { MagnifyingGlassIcon, PlusIcon, EyeIcon, PencilIcon, TrashIcon, TruckIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';

interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  vehicleNumber: string;
  vehicleType: string;
  status: 'available' | 'busy' | 'offline';
  currentLocation: string;
  totalDeliveries: number;
  rating: number;
  joinedDate: string;
}

interface Route {
  id: string;
  name: string;
  driverId: string;
  driverName: string;
  stops: number;
  distance: string;
  estimatedTime: string;
  status: 'planned' | 'in-progress' | 'completed';
  orders: string[];
}

const mockDrivers: Driver[] = [
  {
    id: '1',
    name: 'Rajesh Kumar',
    phone: '+91 9876543210',
    email: 'rajesh@mawell.com',
    vehicleNumber: 'MH-01-AB-1234',
    vehicleType: 'Truck',
    status: 'available',
    currentLocation: 'Mumbai Central',
    totalDeliveries: 245,
    rating: 4.8,
    joinedDate: '2023-06-15'
  },
  {
    id: '2',
    name: 'Suresh Patil',
    phone: '+91 9876543211',
    email: 'suresh@mawell.com',
    vehicleNumber: 'MH-02-CD-5678',
    vehicleType: 'Van',
    status: 'busy',
    currentLocation: 'Andheri East',
    totalDeliveries: 189,
    rating: 4.6,
    joinedDate: '2023-08-20'
  },
  {
    id: '3',
    name: 'Amit Sharma',
    phone: '+91 9876543212',
    email: 'amit@mawell.com',
    vehicleNumber: 'MH-03-EF-9012',
    vehicleType: 'Bike',
    status: 'offline',
    currentLocation: 'Bandra West',
    totalDeliveries: 156,
    rating: 4.7,
    joinedDate: '2023-04-10'
  }
];

const mockRoutes: Route[] = [
  {
    id: '1',
    name: 'Route A - Central Mumbai',
    driverId: '1',
    driverName: 'Rajesh Kumar',
    stops: 8,
    distance: '45 km',
    estimatedTime: '3h 30m',
    status: 'in-progress',
    orders: ['ORD-001', 'ORD-002', 'ORD-003']
  },
  {
    id: '2',
    name: 'Route B - Western Suburbs',
    driverId: '2',
    driverName: 'Suresh Patil',
    stops: 6,
    distance: '32 km',
    estimatedTime: '2h 45m',
    status: 'planned',
    orders: ['ORD-004', 'ORD-005']
  }
];

export default function LogisticsPage() {
  const [activeTab, setActiveTab] = useState<'drivers' | 'routes'>('drivers');
  const [drivers, setDrivers] = useState<Driver[]>(mockDrivers);
  const [routes, setRoutes] = useState<Route[]>(mockRoutes);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'busy' | 'offline'>('all');

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || driver.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-yellow-100 text-yellow-800';
      case 'offline': return 'bg-red-100 text-red-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'planned': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Logistics Management</h1>
            <p className="text-gray-600">Manage drivers, routes, and delivery operations</p>
          </div>
          <div className="flex gap-3">
            <button className="btn-primary flex items-center gap-2">
              <TruckIcon className="h-5 w-5" />
              Add Driver
            </button>
            <button className="btn-primary flex items-center gap-2">
              <MapPinIcon className="h-5 w-5" />
              Plan Route
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Total Drivers</h3>
            <p className="text-2xl font-bold text-gray-900">{drivers.length}</p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Available Drivers</h3>
            <p className="text-2xl font-bold text-green-600">
              {drivers.filter(d => d.status === 'available').length}
            </p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Active Routes</h3>
            <p className="text-2xl font-bold text-blue-600">
              {routes.filter(r => r.status === 'in-progress').length}
            </p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Avg Rating</h3>
            <p className="text-2xl font-bold text-purple-600">
              {(drivers.reduce((sum, d) => sum + d.rating, 0) / drivers.length).toFixed(1)}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('drivers')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'drivers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Drivers
            </button>
            <button
              onClick={() => setActiveTab('routes')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'routes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Routes
            </button>
          </nav>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  className="input-field pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            {activeTab === 'drivers' && (
              <div className="sm:w-48">
                <select
                  className="input-field"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'available' | 'busy' | 'offline')}
                >
                  <option value="all">All Status</option>
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        {activeTab === 'drivers' ? (
          /* Drivers Table */
          <div className="card">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Driver
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deliveries
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDrivers.map((driver) => (
                    <tr key={driver.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                          <div className="text-sm text-gray-500">{driver.phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">{driver.vehicleNumber}</div>
                          <div className="text-sm text-gray-500">{driver.vehicleType}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(driver.status)}`}>
                          {driver.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {driver.currentLocation}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {driver.totalDeliveries}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ⭐ {driver.rating}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Routes Table */
          <div className="card">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Route
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Driver
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {routes.map((route) => (
                    <tr key={route.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{route.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{route.driverName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">{route.stops} stops • {route.distance}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <ClockIcon className="h-4 w-4" />
                            {route.estimatedTime}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(route.status)}`}>
                          {route.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {route.orders.length} orders
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}