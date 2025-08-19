'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TruckIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

const orderStatuses = [
  'All Status',
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
  'Returned',
];

const orders = [
  {
    id: 'ORD-001',
    customer: {
      name: 'Rajesh Kumar',
      email: 'rajesh@example.com',
      phone: '+91 98765 43210',
    },
    items: [
      { name: 'Samsung Galaxy S24', quantity: 1, price: 79999 },
      { name: 'Phone Case', quantity: 1, price: 1999 },
    ],
    total: 81998,
    status: 'Processing',
    priority: 'High',
    paymentMethod: 'UPI',
    paymentStatus: 'Paid',
    shippingAddress: 'Mumbai, Maharashtra',
    orderDate: '2024-01-15T10:30:00Z',
    estimatedDelivery: '2024-01-18',
    driver: null,
  },
  {
    id: 'ORD-002',
    customer: {
      name: 'Priya Sharma',
      email: 'priya@example.com',
      phone: '+91 87654 32109',
    },
    items: [
      { name: 'Nike Air Max 270', quantity: 2, price: 12999 },
    ],
    total: 25998,
    status: 'Shipped',
    priority: 'Medium',
    paymentMethod: 'Credit Card',
    paymentStatus: 'Paid',
    shippingAddress: 'Delhi, Delhi',
    orderDate: '2024-01-14T15:45:00Z',
    estimatedDelivery: '2024-01-17',
    driver: 'Amit Singh',
  },
  {
    id: 'ORD-003',
    customer: {
      name: 'Amit Patel',
      email: 'amit@example.com',
      phone: '+91 76543 21098',
    },
    items: [
      { name: 'MacBook Pro 14"', quantity: 1, price: 199999 },
    ],
    total: 199999,
    status: 'Confirmed',
    priority: 'High',
    paymentMethod: 'Bank Transfer',
    paymentStatus: 'Pending',
    shippingAddress: 'Bangalore, Karnataka',
    orderDate: '2024-01-14T09:20:00Z',
    estimatedDelivery: '2024-01-19',
    driver: null,
  },
  {
    id: 'ORD-004',
    customer: {
      name: 'Sunita Gupta',
      email: 'sunita@example.com',
      phone: '+91 65432 10987',
    },
    items: [
      { name: 'Levi\'s 501 Jeans', quantity: 3, price: 4999 },
    ],
    total: 14997,
    status: 'Delivered',
    priority: 'Low',
    paymentMethod: 'COD',
    paymentStatus: 'Paid',
    shippingAddress: 'Chennai, Tamil Nadu',
    orderDate: '2024-01-13T14:10:00Z',
    estimatedDelivery: '2024-01-16',
    driver: 'Ravi Kumar',
  },
  {
    id: 'ORD-005',
    customer: {
      name: 'Vikram Singh',
      email: 'vikram@example.com',
      phone: '+91 54321 09876',
    },
    items: [
      { name: 'Sony WH-1000XM5', quantity: 1, price: 29999 },
    ],
    total: 29999,
    status: 'Pending',
    priority: 'Medium',
    paymentMethod: 'UPI',
    paymentStatus: 'Failed',
    shippingAddress: 'Pune, Maharashtra',
    orderDate: '2024-01-13T11:30:00Z',
    estimatedDelivery: '2024-01-18',
    driver: null,
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'Confirmed':
      return 'bg-blue-100 text-blue-800';
    case 'Processing':
      return 'bg-purple-100 text-purple-800';
    case 'Shipped':
      return 'bg-indigo-100 text-indigo-800';
    case 'Delivered':
      return 'bg-green-100 text-green-800';
    case 'Cancelled':
      return 'bg-red-100 text-red-800';
    case 'Returned':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'High':
      return 'bg-red-100 text-red-800';
    case 'Medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'Low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case 'Paid':
      return 'bg-green-100 text-green-800';
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'Failed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [showFilters, setShowFilters] = useState(false);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.phone.includes(searchTerm);
    const matchesStatus = selectedStatus === 'All Status' || order.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage and track all customer orders
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary flex items-center">
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Export
            </button>
            <button className="btn-secondary flex items-center">
              <PrinterIcon className="h-5 w-5 mr-2" />
              Print
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="input-field pl-10"
                  placeholder="Search by order ID, customer name, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="sm:w-48">
              <select
                className="input-field"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                {orderStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Toggle */}
            <button
              className="btn-secondary flex items-center"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Range
                  </label>
                  <input
                    type="date"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select className="input-field">
                    <option value="">All Priorities</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Status
                  </label>
                  <select className="input-field">
                    <option value="">All Payment Status</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount Range
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      className="input-field"
                      placeholder="Min"
                    />
                    <input
                      type="number"
                      className="input-field"
                      placeholder="Max"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Orders Table */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Orders ({filteredOrders.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.id}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(order.orderDate)}
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(order.priority)}`}>
                          {order.priority}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.customer.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.customer.phone}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.shippingAddress}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {order.items.map((item, index) => (
                          <div key={index} className="mb-1">
                            {item.name} × {item.quantity}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{order.total.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.paymentMethod}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.driver || (
                        <button className="text-primary-600 hover:text-primary-900 text-sm">
                          Assign Driver
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button className="text-primary-600 hover:text-primary-900">
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-900">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button className="text-blue-600 hover:text-blue-900">
                          <TruckIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredOrders.length}</span> of{' '}
            <span className="font-medium">{orders.length}</span> results
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary text-sm" disabled>
              Previous
            </button>
            <button className="btn-primary text-sm">
              Next
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}