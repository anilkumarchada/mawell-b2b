'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import apiService, { ApiEndpoint, ApiHealthCheck } from '../../services/apiService';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  PlayIcon,
  DocumentTextIcon,
  CogIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'active':
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    case 'inactive':
      return <XCircleIcon className="h-5 w-5 text-gray-400" />;
    case 'error':
      return <XCircleIcon className="h-5 w-5 text-red-500" />;
    case 'maintenance':
      return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
    default:
      return <ClockIcon className="h-5 w-5 text-gray-400" />;
  }
};

const getStatusBadge = (status: string) => {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  switch (status) {
    case 'active':
      return `${baseClasses} bg-green-100 text-green-800`;
    case 'inactive':
      return `${baseClasses} bg-gray-100 text-gray-800`;
    case 'error':
      return `${baseClasses} bg-red-100 text-red-800`;
    case 'maintenance':
      return `${baseClasses} bg-yellow-100 text-yellow-800`;
    default:
      return `${baseClasses} bg-gray-100 text-gray-800`;
  }
};

const getMethodBadge = (method: string) => {
  const baseClasses = 'inline-flex items-center px-2 py-1 rounded text-xs font-medium';
  switch (method) {
    case 'GET':
      return `${baseClasses} bg-blue-100 text-blue-800`;
    case 'POST':
      return `${baseClasses} bg-green-100 text-green-800`;
    case 'PUT':
      return `${baseClasses} bg-yellow-100 text-yellow-800`;
    case 'DELETE':
      return `${baseClasses} bg-red-100 text-red-800`;
    case 'PATCH':
      return `${baseClasses} bg-purple-100 text-purple-800`;
    default:
      return `${baseClasses} bg-gray-100 text-gray-800`;
  }
};

export default function APIsPage() {
  const [apis, setApis] = useState<ApiEndpoint[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApi, setSelectedApi] = useState<ApiEndpoint | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [isTestingApi, setIsTestingApi] = useState(false);

  // Load APIs on component mount
  useEffect(() => {
    loadApis();
  }, []);

  const loadApis = async () => {
    try {
      setIsLoading(true);
      const apiData = await apiService.getApiEndpoints();
      setApis(apiData);
    } catch (error) {
      console.error('Failed to load APIs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredApis = apis.filter(api => {
    if (filter === 'all') return true;
    return api.status === filter;
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const healthChecks = await apiService.checkAllApisHealth();
      
      // Update APIs with health check results
      setApis(prev => prev.map(api => {
        const healthCheck = healthChecks.find(hc => hc.endpoint === api.path);
        if (healthCheck) {
          let newStatus: ApiEndpoint['status'] = api.status;
          
          if (healthCheck.error) {
            newStatus = 'error';
          } else if (healthCheck.status >= 200 && healthCheck.status < 300) {
            newStatus = 'active';
          } else if (healthCheck.status >= 500) {
            newStatus = 'error';
          } else {
            newStatus = 'inactive';
          }
          
          return {
            ...api,
            status: newStatus,
            responseTime: healthCheck.responseTime,
            lastChecked: healthCheck.timestamp,
          };
        }
        return api;
      }));
    } catch (error) {
      console.error('Failed to refresh API status:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTestApi = async (api: ApiEndpoint) => {
    setIsTestingApi(true);
    setSelectedApi(api);
    setTestResult(null);
    
    try {
      const result = await apiService.testApiEndpoint(api);
      setTestResult(result);
    } catch (error) {
      setTestResult({
        error: error instanceof Error ? error.message : 'Test failed',
        status: 0,
      });
    } finally {
      setIsTestingApi(false);
    }
  };

  const handleViewLogs = async (api: ApiEndpoint) => {
    // This would open a modal or navigate to a logs page
    console.log('View logs for:', api.name);
    // For now, just log to console
    try {
      const logs = await apiService.getApiLogs(api.id);
      console.log('API Logs:', logs);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  };

  const handleConfigure = async (api: ApiEndpoint) => {
    // This would open a configuration modal
    console.log('Configure:', api.name);
    try {
      const config = await apiService.getApiConfiguration(api.id);
      console.log('API Configuration:', config);
    } catch (error) {
      console.error('Failed to fetch configuration:', error);
    }
  };

  const getStats = () => {
    const active = apis.filter(api => api.status === 'active').length;
    const error = apis.filter(api => api.status === 'error').length;
    const maintenance = apis.filter(api => api.status === 'maintenance').length;
    const inactive = apis.filter(api => api.status === 'inactive').length;
    
    return { active, error, maintenance, inactive, total: apis.length };
  };

  const stats = getStats();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              API Management
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Monitor and manage all backend API endpoints
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              <ArrowPathIcon className={clsx('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Status'}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.active}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <XCircleIcon className="h-6 w-6 text-red-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Error</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.error}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Maintenance</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.maintenance}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <XCircleIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Inactive</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.inactive}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'all', label: 'All APIs', count: stats.total },
              { key: 'active', label: 'Active', count: stats.active },
              { key: 'error', label: 'Error', count: stats.error },
              { key: 'maintenance', label: 'Maintenance', count: stats.maintenance },
              { key: 'inactive', label: 'Inactive', count: stats.inactive },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={clsx(
                  'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm',
                  filter === tab.key
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                {tab.label}
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* API List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredApis.map((api) => (
              <li key={api.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getStatusIcon(api.status)}
                      <div className="ml-4">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900">{api.name}</p>
                          <span className={getMethodBadge(api.method)}>{api.method}</span>
                          <span className={getStatusBadge(api.status)}>
                            {api.status.charAt(0).toUpperCase() + api.status.slice(1)}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                          <span className="font-mono">{api.path}</span>
                          <span>•</span>
                          <span>v{api.version}</span>
                          {api.status === 'active' && (
                            <>
                              <span>•</span>
                              <span>{api.responseTime}ms</span>
                            </>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-500">{api.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <p className="text-sm text-gray-500">
                        Last checked: {new Date(api.lastChecked).toLocaleString()}
                      </p>
                      <div className="mt-2 flex space-x-2">
                        <button 
                          onClick={() => handleTestApi(api)}
                          disabled={isTestingApi}
                          className="inline-flex items-center text-primary-600 hover:text-primary-900 text-sm font-medium disabled:opacity-50"
                        >
                          <PlayIcon className="h-4 w-4 mr-1" />
                          {isTestingApi && selectedApi?.id === api.id ? 'Testing...' : 'Test'}
                        </button>
                        <button 
                          onClick={() => handleViewLogs(api)}
                          className="inline-flex items-center text-gray-600 hover:text-gray-900 text-sm font-medium"
                        >
                          <DocumentTextIcon className="h-4 w-4 mr-1" />
                          Logs
                        </button>
                        <button 
                          onClick={() => handleConfigure(api)}
                          className="inline-flex items-center text-gray-600 hover:text-gray-900 text-sm font-medium"
                        >
                          <CogIcon className="h-4 w-4 mr-1" />
                          Configure
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Test Result Modal */}
        {testResult && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Test Result: {selectedApi?.name}
                  </h3>
                  <button
                    onClick={() => setTestResult(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-500">Status:</span>
                    <span className={clsx(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      testResult.error || testResult.status >= 400
                        ? 'bg-red-100 text-red-800'
                        : testResult.status >= 200 && testResult.status < 300
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    )}>
                      {testResult.error ? 'Error' : `${testResult.status} ${testResult.statusText || ''}`}
                    </span>
                  </div>
                  
                  {testResult.error ? (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                      <h4 className="text-sm font-medium text-red-800 mb-2">Error Details</h4>
                      <p className="text-sm text-red-700">{testResult.error}</p>
                    </div>
                  ) : (
                    <>
                      {testResult.headers && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Response Headers</h4>
                          <div className="bg-gray-50 rounded-md p-3 max-h-32 overflow-y-auto">
                            <pre className="text-xs text-gray-700">
                              {JSON.stringify(testResult.headers, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                      
                      {testResult.data && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Response Data</h4>
                          <div className="bg-gray-50 rounded-md p-3 max-h-64 overflow-y-auto">
                            <pre className="text-xs text-gray-700">
                              {JSON.stringify(testResult.data, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setTestResult(null)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}