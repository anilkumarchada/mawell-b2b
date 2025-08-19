import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Button,
  Card,
  Divider,
  IconButton,
  Menu,
  SegmentedButtons,
  useTheme
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
// @ts-ignore - Temporarily ignore type errors for react-native-chart-kit
import { OperationsStackParamList } from '@/navigation/OperationsNavigator';
import { StackNavigationProp } from '@react-navigation/stack';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';

type ReportsScreenNavigationProp = StackNavigationProp<OperationsStackParamList, 'Reports'>;

interface Props {
  navigation: ReportsScreenNavigationProp;
}

type TimeRange = 'today' | 'week' | 'month' | 'quarter' | 'year';
type ReportType = 'sales' | 'orders' | 'inventory' | 'delivery';

interface SalesData {
  period: string;
  revenue: number;
  orders: number;
  avgOrderValue: number;
}

interface OrderStatusData {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

interface TopProduct {
  id: string;
  name: string;
  sales: number;
  revenue: number;
  growth: number;
}

interface DeliveryMetrics {
  totalDeliveries: number;
  onTimeDeliveries: number;
  avgDeliveryTime: number;
  failedDeliveries: number;
  onTimePercentage: number;
}

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 32;

// Mock data
const mockSalesData: SalesData[] = [
  { period: 'Jan', revenue: 125000, orders: 89, avgOrderValue: 1404 },
  { period: 'Feb', revenue: 142000, orders: 95, avgOrderValue: 1495 },
  { period: 'Mar', revenue: 158000, orders: 112, avgOrderValue: 1411 },
  { period: 'Apr', revenue: 171000, orders: 128, avgOrderValue: 1336 },
  { period: 'May', revenue: 189000, orders: 145, avgOrderValue: 1303 },
  { period: 'Jun', revenue: 205000, orders: 156, avgOrderValue: 1314 },
];

const mockOrderStatusData: OrderStatusData[] = [
  { status: 'Delivered', count: 245, percentage: 68.2, color: '#10B981' },
  { status: 'Shipped', count: 45, percentage: 12.5, color: '#06B6D4' },
  { status: 'Processing', count: 32, percentage: 8.9, color: '#8B5CF6' },
  { status: 'Pending', count: 25, percentage: 7.0, color: '#F59E0B' },
  { status: 'Cancelled', count: 12, percentage: 3.4, color: '#EF4444' },
];

const mockTopProducts: TopProduct[] = [
  { id: '1', name: 'Premium Wireless Headphones', sales: 156, revenue: 202440, growth: 15.2 },
  { id: '2', name: 'Smart Fitness Watch', sales: 89, revenue: 222411, growth: 8.7 },
  { id: '3', name: 'Bluetooth Speaker', sales: 134, revenue: 120466, growth: -2.1 },
  { id: '4', name: 'USB-C Cable', sales: 267, revenue: 79833, growth: 22.5 },
  { id: '5', name: 'Wireless Charger', sales: 78, revenue: 93600, growth: 5.3 },
];

const mockDeliveryMetrics: DeliveryMetrics = {
  totalDeliveries: 245,
  onTimeDeliveries: 221,
  avgDeliveryTime: 24.5,
  failedDeliveries: 8,
  onTimePercentage: 90.2,
};

export function ReportsScreen({ navigation }: Props) {
  const theme = useTheme();
  
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [reportType, setReportType] = useState<ReportType>('sales');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [loading, setLoading] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? '#10B981' : '#EF4444';
  };

  const exportReport = (format: 'pdf' | 'excel' | 'csv') => {
    setShowExportMenu(false);
    Alert.alert(
      'Export Report',
      `Export ${reportType} report as ${format.toUpperCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => {
            Alert.alert('Success', `Report exported as ${format.toUpperCase()}`);
          },
        },
      ]
    );
  };

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => theme.colors.onSurface,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#3B82F6',
    },
  };

  const salesChartData = {
    labels: mockSalesData.map(item => item.period),
    datasets: [
      {
        data: mockSalesData.map(item => item.revenue / 1000),
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const ordersChartData = {
    labels: mockSalesData.map(item => item.period),
    datasets: [
      {
        data: mockSalesData.map(item => item.orders),
      },
    ],
  };

  const orderStatusPieData = mockOrderStatusData.map(item => ({
    name: item.status,
    population: item.count,
    color: item.color,
    legendFontColor: theme.colors.onSurface,
    legendFontSize: 12,
  }));

  const timeRangeButtons = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'quarter', label: 'Quarter' },
  ];

  const reportTypeButtons = [
    { value: 'sales', label: 'Sales' },
    { value: 'orders', label: 'Orders' },
    { value: 'inventory', label: 'Inventory' },
    { value: 'delivery', label: 'Delivery' },
  ];

  const renderSalesReport = () => (
    <>
      {/* Revenue Chart */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
              Revenue Trend (₹ in thousands)
            </Text>
          </View>
          <LineChart
            data={salesChartData}
            width={chartWidth - 32}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      {/* Key Metrics */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Key Metrics
          </Text>
          
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: theme.colors.primary }]}>
                {formatCurrency(mockSalesData.reduce((sum, item) => sum + item.revenue, 0))}
              </Text>
              <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>
                Total Revenue
              </Text>
            </View>
            
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: theme.colors.primary }]}>
                {formatNumber(mockSalesData.reduce((sum, item) => sum + item.orders, 0))}
              </Text>
              <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>
                Total Orders
              </Text>
            </View>
            
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: theme.colors.primary }]}>
                {formatCurrency(mockSalesData.reduce((sum, item) => sum + item.avgOrderValue, 0) / mockSalesData.length)}
              </Text>
              <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>
                Avg Order Value
              </Text>
            </View>
            
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: '#10B981' }]}>
                +12.5%
              </Text>
              <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>
                Growth Rate
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Top Products */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Top Products
          </Text>
          
          {mockTopProducts.map((product, index) => (
            <View key={product.id}>
              <View style={styles.productItem}>
                <View style={styles.productRank}>
                  <Text style={[styles.rankNumber, { color: theme.colors.primary }]}>
                    {index + 1}
                  </Text>
                </View>
                
                <View style={styles.productInfo}>
                  <Text style={[styles.productName, { color: theme.colors.onSurface }]}>
                    {product.name}
                  </Text>
                  <Text style={[styles.productStats, { color: theme.colors.onSurfaceVariant }]}>
                    {formatNumber(product.sales)} sales • {formatCurrency(product.revenue)}
                  </Text>
                </View>
                
                <View style={styles.productGrowth}>
                  <Text style={[styles.growthValue, { color: getGrowthColor(product.growth) }]}>
                    {product.growth >= 0 ? '+' : ''}{product.growth.toFixed(1)}%
                  </Text>
                </View>
              </View>
              {index < mockTopProducts.length - 1 && <Divider style={styles.divider} />}
            </View>
          ))}
        </Card.Content>
      </Card>
    </>
  );

  const renderOrdersReport = () => (
    <>
      {/* Orders Chart */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
              Orders Trend
            </Text>
          </View>
          <BarChart
            data={ordersChartData}
            width={chartWidth - 32}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      {/* Order Status Distribution */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Order Status Distribution
          </Text>
          
          <PieChart
            data={orderStatusPieData}
            width={chartWidth - 32}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            style={styles.chart}
          />
          
          <View style={styles.statusList}>
            {mockOrderStatusData.map((item, index) => (
              <View key={index} style={styles.statusItem}>
                <View style={[styles.statusIndicator, { backgroundColor: item.color }]} />
                <Text style={[styles.statusLabel, { color: theme.colors.onSurface }]}>
                  {item.status}
                </Text>
                <Text style={[styles.statusCount, { color: theme.colors.onSurfaceVariant }]}>
                  {formatNumber(item.count)} ({item.percentage}%)
                </Text>
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>
    </>
  );

  const renderInventoryReport = () => (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Inventory Summary
        </Text>
        
        <View style={styles.inventoryGrid}>
          <View style={styles.inventoryItem}>
            <Ionicons name="cube-outline" size={32} color={theme.colors.primary} />
            <Text style={[styles.inventoryValue, { color: theme.colors.onSurface }]}>
              1,247
            </Text>
            <Text style={[styles.inventoryLabel, { color: theme.colors.onSurfaceVariant }]}>
              Total Products
            </Text>
          </View>
          
          <View style={styles.inventoryItem}>
            <Ionicons name="checkmark-circle-outline" size={32} color="#10B981" />
            <Text style={[styles.inventoryValue, { color: theme.colors.onSurface }]}>
              1,089
            </Text>
            <Text style={[styles.inventoryLabel, { color: theme.colors.onSurfaceVariant }]}>
              In Stock
            </Text>
          </View>
          
          <View style={styles.inventoryItem}>
            <Ionicons name="warning-outline" size={32} color="#F59E0B" />
            <Text style={[styles.inventoryValue, { color: theme.colors.onSurface }]}>
              89
            </Text>
            <Text style={[styles.inventoryLabel, { color: theme.colors.onSurfaceVariant }]}>
              Low Stock
            </Text>
          </View>
          
          <View style={styles.inventoryItem}>
            <Ionicons name="close-circle-outline" size={32} color="#EF4444" />
            <Text style={[styles.inventoryValue, { color: theme.colors.onSurface }]}>
              69
            </Text>
            <Text style={[styles.inventoryLabel, { color: theme.colors.onSurfaceVariant }]}>
              Out of Stock
            </Text>
          </View>
        </View>
        
        <Divider style={styles.sectionDivider} />
        
        <Text style={[styles.subsectionTitle, { color: theme.colors.onSurface }]}>
          Stock Alerts
        </Text>
        
        <View style={styles.alertsList}>
          <View style={styles.alertItem}>
            <Ionicons name="warning" size={20} color="#F59E0B" />
            <Text style={[styles.alertText, { color: theme.colors.onSurface }]}>
              Premium Wireless Headphones - Only 5 units left
            </Text>
          </View>
          
          <View style={styles.alertItem}>
            <Ionicons name="alert-circle" size={20} color="#EF4444" />
            <Text style={[styles.alertText, { color: theme.colors.onSurface }]}>
              USB-C Cable - Out of stock
            </Text>
          </View>
          
          <View style={styles.alertItem}>
            <Ionicons name="warning" size={20} color="#F59E0B" />
            <Text style={[styles.alertText, { color: theme.colors.onSurface }]}>
              Bluetooth Speaker - Low stock (8 units)
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderDeliveryReport = () => (
    <>
      {/* Delivery Metrics */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Delivery Performance
          </Text>
          
          <View style={styles.deliveryGrid}>
            <View style={styles.deliveryItem}>
              <Text style={[styles.deliveryValue, { color: theme.colors.primary }]}>
                {formatNumber(mockDeliveryMetrics.totalDeliveries)}
              </Text>
              <Text style={[styles.deliveryLabel, { color: theme.colors.onSurfaceVariant }]}>
                Total Deliveries
              </Text>
            </View>
            
            <View style={styles.deliveryItem}>
              <Text style={[styles.deliveryValue, { color: '#10B981' }]}>
                {mockDeliveryMetrics.onTimePercentage.toFixed(1)}%
              </Text>
              <Text style={[styles.deliveryLabel, { color: theme.colors.onSurfaceVariant }]}>
                On-Time Rate
              </Text>
            </View>
            
            <View style={styles.deliveryItem}>
              <Text style={[styles.deliveryValue, { color: theme.colors.primary }]}>
                {mockDeliveryMetrics.avgDeliveryTime.toFixed(1)}h
              </Text>
              <Text style={[styles.deliveryLabel, { color: theme.colors.onSurfaceVariant }]}>
                Avg Delivery Time
              </Text>
            </View>
            
            <View style={styles.deliveryItem}>
              <Text style={[styles.deliveryValue, { color: '#EF4444' }]}>
                {formatNumber(mockDeliveryMetrics.failedDeliveries)}
              </Text>
              <Text style={[styles.deliveryLabel, { color: theme.colors.onSurfaceVariant }]}>
                Failed Deliveries
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Driver Performance */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Top Drivers
          </Text>
          
          {[
            { id: 'DRV-001', name: 'Rajesh Kumar', deliveries: 45, rating: 4.8, onTime: 95.5 },
            { id: 'DRV-002', name: 'Amit Singh', deliveries: 38, rating: 4.6, onTime: 92.1 },
            { id: 'DRV-003', name: 'Suresh Patel', deliveries: 42, rating: 4.7, onTime: 89.3 },
          ].map((driver, index) => (
            <View key={driver.id}>
              <View style={styles.driverItem}>
                <View style={styles.driverRank}>
                  <Text style={[styles.rankNumber, { color: theme.colors.primary }]}>
                    {index + 1}
                  </Text>
                </View>
                
                <View style={styles.driverInfo}>
                  <Text style={[styles.driverName, { color: theme.colors.onSurface }]}>
                    {driver.name}
                  </Text>
                  <Text style={[styles.driverStats, { color: theme.colors.onSurfaceVariant }]}>
                    {driver.deliveries} deliveries • {driver.rating}★ • {driver.onTime}% on-time
                  </Text>
                </View>
              </View>
              {index < 2 && <Divider style={styles.divider} />}
            </View>
          ))}
        </Card.Content>
      </Card>
    </>
  );

  const renderReport = () => {
    switch (reportType) {
      case 'sales':
        return renderSalesReport();
      case 'orders':
        return renderOrdersReport();
      case 'inventory':
        return renderInventoryReport();
      case 'delivery':
        return renderDeliveryReport();
      default:
        return renderSalesReport();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
            Reports & Analytics
          </Text>
          
          <Menu
            visible={showExportMenu}
            onDismiss={() => setShowExportMenu(false)}
            anchor={
              <IconButton
                icon="download"
                onPress={() => setShowExportMenu(true)}
              />
            }
          >
            <Menu.Item onPress={() => exportReport('pdf')} title="Export as PDF" />
            <Menu.Item onPress={() => exportReport('excel')} title="Export as Excel" />
            <Menu.Item onPress={() => exportReport('csv')} title="Export as CSV" />
          </Menu>
        </View>
        
        <SegmentedButtons
          value={reportType}
          onValueChange={(value) => setReportType(value as ReportType)}
          buttons={reportTypeButtons}
          style={styles.reportTypeButtons}
        />
        
        <SegmentedButtons
          value={timeRange}
          onValueChange={(value) => setTimeRange(value as TimeRange)}
          buttons={timeRangeButtons}
          style={styles.timeRangeButtons}
        />
      </View>

      {/* Reports Content */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {renderReport()}
        
        {/* Generate Custom Report */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Custom Reports
            </Text>
            
            <Text style={[styles.customReportText, { color: theme.colors.onSurfaceVariant }]}>
              Need a specific report? Generate custom reports with advanced filters and date ranges.
            </Text>
            
            <Button
              mode="contained"
              onPress={() => Alert.alert('Custom Report', 'Custom report builder would be implemented here')}
              style={styles.customReportButton}
              icon="chart-line"
            >
              Generate Custom Report
            </Button>
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
    padding: 16,
    gap: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  reportTypeButtons: {},
  timeRangeButtons: {},
  card: {
    margin: 16,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  chartHeader: {
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  chart: {
    borderRadius: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metricItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  productRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  productStats: {
    fontSize: 12,
  },
  productGrowth: {
    alignItems: 'flex-end',
  },
  growthValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 4,
  },
  statusList: {
    marginTop: 16,
    gap: 8,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusLabel: {
    flex: 1,
    fontSize: 14,
  },
  statusCount: {
    fontSize: 12,
  },
  inventoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  inventoryItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  inventoryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  inventoryLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  sectionDivider: {
    marginVertical: 16,
  },
  alertsList: {
    gap: 8,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
  },
  alertText: {
    flex: 1,
    fontSize: 12,
  },
  deliveryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  deliveryItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  deliveryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  deliveryLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  driverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  driverRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  driverStats: {
    fontSize: 12,
  },
  customReportText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  customReportButton: {},
});