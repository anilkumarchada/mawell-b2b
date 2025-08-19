import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useTheme,
  Card,
  Button,
  Chip,
  Avatar,
  IconButton,
  ProgressBar,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { StackNavigationProp } from '@react-navigation/stack';
import { OperationsStackParamList } from '@/navigation/OperationsNavigator';
import { useAuth } from '@/store/AuthContext';

type DashboardScreenNavigationProp = StackNavigationProp<OperationsStackParamList, 'Dashboard'>;

interface Props {
  navigation: DashboardScreenNavigationProp;
}

interface DashboardMetrics {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  activeDrivers: number;
  totalDrivers: number;
  lowStockItems: number;
  totalProducts: number;
  averageDeliveryTime: number;
  customerSatisfaction: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  status: string;
  total: number;
  createdAt: string;
  priority: 'high' | 'medium' | 'low';
}

interface AlertItem {
  id: string;
  type: 'stock' | 'delivery' | 'system' | 'driver';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  timestamp: string;
}

const { width } = Dimensions.get('window');

// Mock data
const mockMetrics: DashboardMetrics = {
  totalOrders: 1247,
  pendingOrders: 23,
  completedOrders: 1198,
  cancelledOrders: 26,
  totalRevenue: 2847650,
  todayRevenue: 45780,
  activeDrivers: 18,
  totalDrivers: 25,
  lowStockItems: 7,
  totalProducts: 1250,
  averageDeliveryTime: 2.4,
  customerSatisfaction: 4.6,
};

const mockRecentOrders: RecentOrder[] = [
  {
    id: '1',
    orderNumber: 'ORD-2024-001',
    customerName: 'John Doe',
    status: 'pending',
    total: 1299,
    createdAt: '2024-01-24T10:30:00Z',
    priority: 'high',
  },
  {
    id: '2',
    orderNumber: 'ORD-2024-002',
    customerName: 'Jane Smith',
    status: 'processing',
    total: 2499,
    createdAt: '2024-01-24T09:15:00Z',
    priority: 'medium',
  },
  {
    id: '3',
    orderNumber: 'ORD-2024-003',
    customerName: 'Mike Johnson',
    status: 'shipped',
    total: 899,
    createdAt: '2024-01-24T08:45:00Z',
    priority: 'low',
  },
  {
    id: '4',
    orderNumber: 'ORD-2024-004',
    customerName: 'Sarah Wilson',
    status: 'delivered',
    total: 1599,
    createdAt: '2024-01-23T16:20:00Z',
    priority: 'medium',
  },
];

const mockAlerts: AlertItem[] = [
  {
    id: '1',
    type: 'stock',
    title: 'Low Stock Alert',
    description: 'Premium Wireless Headphones - Only 3 units left',
    severity: 'high',
    timestamp: '2024-01-24T11:00:00Z',
  },
  {
    id: '2',
    type: 'delivery',
    title: 'Delayed Delivery',
    description: 'CON-2024-001 is running 30 minutes behind schedule',
    severity: 'medium',
    timestamp: '2024-01-24T10:45:00Z',
  },
  {
    id: '3',
    type: 'driver',
    title: 'Driver Unavailable',
    description: 'Driver #DRV-001 reported vehicle breakdown',
    severity: 'high',
    timestamp: '2024-01-24T10:15:00Z',
  },
];

// Chart data
const salesData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      data: [42000, 38000, 45000, 52000, 48000, 55000, 47000],
      strokeWidth: 2,
    },
  ],
};

const orderStatusData = [
  {
    name: 'Completed',
    population: 1198,
    color: '#10B981',
    legendFontColor: '#7F7F7F',
    legendFontSize: 12,
  },
  {
    name: 'Pending',
    population: 23,
    color: '#F59E0B',
    legendFontColor: '#7F7F7F',
    legendFontSize: 12,
  },
  {
    name: 'Cancelled',
    population: 26,
    color: '#EF4444',
    legendFontColor: '#7F7F7F',
    legendFontSize: 12,
  },
];

export function DashboardScreen({ navigation }: Props) {
  const theme = useTheme();
  const { user } = useAuth();
  
  const [metrics, setMetrics] = useState<DashboardMetrics>(mockMetrics);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>(mockRecentOrders);
  const [alerts, setAlerts] = useState<AlertItem[]>(mockAlerts);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'processing': return '#3B82F6';
      case 'shipped': return '#8B5CF6';
      case 'delivered': return '#10B981';
      case 'cancelled': return '#EF4444';
      default: return theme.colors.outline;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return theme.colors.outline;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'stock': return 'cube-outline';
      case 'delivery': return 'truck-outline';
      case 'system': return 'alert-circle-outline';
      case 'driver': return 'person-outline';
      default: return 'information-outline';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
    labelColor: (opacity = 1) => theme.colors.onSurfaceVariant,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#6366F1',
    },
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.colors.onSurfaceVariant }]}>
              Good morning,
            </Text>
            <Text style={[styles.userName, { color: theme.colors.onSurface }]}>
              {user?.firstName} {user?.lastName}
            </Text>
          </View>
          <Avatar.Text
            size={40}
            label={user?.firstName?.charAt(0) || 'O'}
            style={{ backgroundColor: theme.colors.primary }}
          />
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricsRow}>
            <Card style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
              <Card.Content style={styles.metricContent}>
                <View style={styles.metricHeader}>
                  <Ionicons name="receipt-outline" size={24} color="#3B82F6" />
                  <Text style={[styles.metricValue, { color: theme.colors.onSurface }]}>
                    {metrics.totalOrders}
                  </Text>
                </View>
                <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Total Orders
                </Text>
                <Text style={[styles.metricChange, { color: '#10B981' }]}>+12%</Text>
              </Card.Content>
            </Card>
            
            <Card style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
              <Card.Content style={styles.metricContent}>
                <View style={styles.metricHeader}>
                  <Ionicons name="wallet-outline" size={24} color="#10B981" />
                  <Text style={[styles.metricValue, { color: theme.colors.onSurface }]}>
                    {formatCurrency(metrics.totalRevenue)}
                  </Text>
                </View>
                <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Total Revenue
                </Text>
                <Text style={[styles.metricChange, { color: '#10B981' }]}>+8%</Text>
              </Card.Content>
            </Card>
          </View>
          
          <View style={styles.metricsRow}>
            <Card style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
              <Card.Content style={styles.metricContent}>
                <View style={styles.metricHeader}>
                  <Ionicons name="people-outline" size={24} color="#8B5CF6" />
                  <Text style={[styles.metricValue, { color: theme.colors.onSurface }]}>
                    {metrics.activeDrivers}/{metrics.totalDrivers}
                  </Text>
                </View>
                <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Active Drivers
                </Text>
                <ProgressBar
                  progress={metrics.activeDrivers / metrics.totalDrivers}
                  color="#8B5CF6"
                  style={styles.progressBar}
                />
              </Card.Content>
            </Card>
            
            <Card style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
              <Card.Content style={styles.metricContent}>
                <View style={styles.metricHeader}>
                  <Ionicons name="cube-outline" size={24} color="#F59E0B" />
                  <Text style={[styles.metricValue, { color: theme.colors.onSurface }]}>
                    {metrics.lowStockItems}
                  </Text>
                </View>
                <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Low Stock Items
                </Text>
                <Text style={[styles.metricChange, { color: '#EF4444' }]}>Needs attention</Text>
              </Card.Content>
            </Card>
          </View>
        </View>

        {/* Sales Chart */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
                Sales This Week
              </Text>
              <IconButton
                icon="dots-vertical"
                size={20}
                onPress={() => {}}
              />
            </View>
            <LineChart
              data={salesData}
              width={width - 64}
              height={200}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </Card.Content>
        </Card>

        {/* Order Status Distribution */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              Order Status Distribution
            </Text>
            <PieChart
              data={orderStatusData}
              width={width - 64}
              height={200}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              center={[10, 0]}
              absolute
            />
          </Card.Content>
        </Card>

        {/* Recent Orders */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
                Recent Orders
              </Text>
              <Button
                mode="text"
                onPress={() => navigation.navigate('Orders')}
                compact
              >
                View All
              </Button>
            </View>
            
            {recentOrders.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderItem}
                onPress={() => navigation.navigate('OrderDetails', { orderId: order.id })}
              >
                <View style={styles.orderInfo}>
                  <Text style={[styles.orderNumber, { color: theme.colors.onSurface }]}>
                    {order.orderNumber}
                  </Text>
                  <Text style={[styles.customerName, { color: theme.colors.onSurfaceVariant }]}>
                    {order.customerName}
                  </Text>
                  <Text style={[styles.orderTime, { color: theme.colors.onSurfaceVariant }]}>
                    {formatTime(order.createdAt)}
                  </Text>
                </View>
                <View style={styles.orderMeta}>
                  <Text style={[styles.orderTotal, { color: theme.colors.onSurface }]}>
                    {formatCurrency(order.total)}
                  </Text>
                  <Chip
                    style={[styles.statusChip, { backgroundColor: getStatusColor(order.status) }]}
                    textStyle={styles.statusChipText}
                    compact
                  >
                    {order.status.toUpperCase()}
                  </Chip>
                </View>
              </TouchableOpacity>
            ))}
          </Card.Content>
        </Card>

        {/* Alerts & Notifications */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
                Alerts & Notifications
              </Text>
              <Button
                mode="text"
                onPress={() => {}}
                compact
              >
                View All
              </Button>
            </View>
            
            {alerts.map((alert) => (
              <View key={alert.id} style={styles.alertItem}>
                <View style={[
                  styles.alertIcon,
                  { backgroundColor: getPriorityColor(alert.severity) + '20' }
                ]}>
                  <Ionicons
                    name={getAlertIcon(alert.type) as any}
                    size={20}
                    color={getPriorityColor(alert.severity)}
                  />
                </View>
                <View style={styles.alertContent}>
                  <Text style={[styles.alertTitle, { color: theme.colors.onSurface }]}>
                    {alert.title}
                  </Text>
                  <Text style={[styles.alertDescription, { color: theme.colors.onSurfaceVariant }]}>
                    {alert.description}
                  </Text>
                  <Text style={[styles.alertTime, { color: theme.colors.onSurfaceVariant }]}>
                    {formatTime(alert.timestamp)}
                  </Text>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              Quick Actions
            </Text>
            
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={[styles.quickAction, { backgroundColor: theme.colors.primaryContainer }]}
                onPress={() => navigation.navigate('Inventory')}
              >
                <Ionicons name="cube-outline" size={24} color={theme.colors.primary} />
                <Text style={[styles.quickActionText, { color: theme.colors.primary }]}>
                  Inventory
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.quickAction, { backgroundColor: theme.colors.secondaryContainer }]}
                onPress={() => navigation.navigate('Orders')}
              >
                <Ionicons name="receipt-outline" size={24} color={theme.colors.secondary} />
                <Text style={[styles.quickActionText, { color: theme.colors.secondary }]}>
                  Orders
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.quickAction, { backgroundColor: theme.colors.tertiaryContainer }]}
                onPress={() => navigation.navigate('Reports')}
              >
                <Ionicons name="bar-chart-outline" size={24} color={theme.colors.tertiary} />
                <Text style={[styles.quickActionText, { color: theme.colors.tertiary }]}>
                  Reports
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.quickAction, { backgroundColor: theme.colors.errorContainer }]}
                onPress={() => {}}
              >
                <Ionicons name="settings-outline" size={24} color={theme.colors.error} />
                <Text style={[styles.quickActionText, { color: theme.colors.error }]}>
                  Settings
                </Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  greeting: {
    fontSize: 14,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  metricsContainer: {
    paddingHorizontal: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  metricCard: {
    flex: 1,
  },
  metricContent: {
    paddingVertical: 12,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  metricLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  metricChange: {
    fontSize: 10,
    fontWeight: '500',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  customerName: {
    fontSize: 12,
    marginBottom: 2,
  },
  orderTime: {
    fontSize: 10,
  },
  orderMeta: {
    alignItems: 'flex-end',
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusChip: {},
  statusChipText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  alertItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  alertDescription: {
    fontSize: 12,
    marginBottom: 2,
  },
  alertTime: {
    fontSize: 10,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  quickAction: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
});