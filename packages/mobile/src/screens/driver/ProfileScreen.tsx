import { DriverStackParamList } from '@/navigation/DriverNavigator';
import { useAuth } from '@/store/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState } from 'react';
import {
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import {
    Avatar,
    Badge,
    Button,
    Card,
    Divider,
    IconButton,
    List,
    Switch,
    useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

type ProfileScreenNavigationProp = StackNavigationProp<DriverStackParamList, keyof DriverStackParamList>;

interface Props {
  navigation: ProfileScreenNavigationProp;
}

interface DriverStats {
  totalDeliveries: number;
  completedDeliveries: number;
  totalDistance: number;
  totalEarnings: number;
  rating: number;
  onTimeDeliveries: number;
  thisMonthDeliveries: number;
  thisMonthEarnings: number;
}

interface NotificationSettings {
  newConsignments: boolean;
  deliveryReminders: boolean;
  routeUpdates: boolean;
  earnings: boolean;
  promotions: boolean;
  systemUpdates: boolean;
}

// Mock driver stats
const mockDriverStats: DriverStats = {
  totalDeliveries: 1247,
  completedDeliveries: 1198,
  totalDistance: 15420,
  totalEarnings: 89650,
  rating: 4.8,
  onTimeDeliveries: 95.2,
  thisMonthDeliveries: 89,
  thisMonthEarnings: 6780,
};

export function ProfileScreen({ navigation }: Props) {
  const theme = useTheme();
  const { currentUser: user, logout } = useAuth();
  
  const [driverStats] = useState<DriverStats>(mockDriverStats);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    newConsignments: true,
    deliveryReminders: true,
    routeUpdates: true,
    earnings: true,
    promotions: false,
    systemUpdates: true,
  });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const handleNotificationToggle = (key: keyof NotificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Profile editing functionality will be implemented.');
  };

  const handleViewEarnings = () => {
    Alert.alert('Earnings', 'Detailed earnings view will be implemented.');
  };

  const handleViewDocuments = () => {
    Alert.alert('Documents', 'Document management will be implemented.');
  };

  const handleVehicleInfo = () => {
    Alert.alert('Vehicle Information', 'Vehicle management will be implemented.');
  };

  const handleEmergencyContact = () => {
    Alert.alert(
      'Emergency Contact',
      'Call emergency support?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => Linking.openURL('tel:+911234567890') },
      ]
    );
  };

  const handleSupport = () => {
    Alert.alert(
      'Support',
      'How would you like to contact support?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => Linking.openURL('tel:+911234567890') },
        { text: 'Email', onPress: () => Linking.openURL('mailto:support@mawell.com') },
        { text: 'WhatsApp', onPress: () => Linking.openURL('whatsapp://send?phone=+911234567890') },
      ]
    );
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://mawell.com/privacy-policy');
  };

  const handleTermsOfService = () => {
    Linking.openURL('https://mawell.com/terms-of-service');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Account Deletion', 'Account deletion request submitted. You will be contacted within 24 hours.');
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDistance = (distance: number) => {
    if (distance >= 1000) {
      return `${(distance / 1000).toFixed(1)}k km`;
    }
    return `${distance} km`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Card style={[styles.headerCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.header}>
              <View style={styles.userInfo}>
                <Avatar.Text
                  size={64}
                  label={user?.firstName?.charAt(0) || 'D'}
                  style={{ backgroundColor: theme.colors.primary }}
                />
                <View style={styles.userDetails}>
                  <Text style={[styles.userName, { color: theme.colors.onSurface }]}>
                    {user?.firstName} {user?.lastName}
                  </Text>
                  <Text style={[styles.userEmail, { color: theme.colors.onSurfaceVariant }]}>
                    {user?.email}
                  </Text>
                  <Text style={[styles.userPhone, { color: theme.colors.onSurfaceVariant }]}>
                    {user?.phone}
                  </Text>
                  <View style={styles.statusContainer}>
                    <View style={[
                      styles.statusIndicator,
                      { backgroundColor: isOnline ? '#10B981' : '#EF4444' }
                    ]} />
                    <Text style={[styles.statusText, { color: theme.colors.onSurfaceVariant }]}>
                      {isOnline ? 'Online' : 'Offline'}
                    </Text>
                    <Switch
                      value={isOnline}
                      onValueChange={setIsOnline}
                      style={styles.statusSwitch}
                    />
                  </View>
                </View>
              </View>
              <IconButton
                icon="pencil"
                size={20}
                onPress={handleEditProfile}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Driver Statistics */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Performance Statistics
            </Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                  {driverStats.totalDeliveries}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Total Deliveries
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                  {driverStats.rating}⭐
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Rating
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                  {formatDistance(driverStats.totalDistance)}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Distance Covered
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                  {formatCurrency(driverStats.totalEarnings)}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Total Earnings
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                  {driverStats.onTimeDeliveries}%
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                  On-Time Delivery
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                  {driverStats.completedDeliveries}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Completed
                </Text>
              </View>
            </View>

            <Divider style={styles.divider} />
            
            <Text style={[styles.subsectionTitle, { color: theme.colors.onSurface }]}>
              This Month
            </Text>
            <View style={styles.monthlyStats}>
              <View style={styles.monthlyStatItem}>
                <Ionicons name="cube-outline" size={20} color={theme.colors.primary} />
                <Text style={[styles.monthlyStatValue, { color: theme.colors.onSurface }]}>
                  {driverStats.thisMonthDeliveries} deliveries
                </Text>
              </View>
              <View style={styles.monthlyStatItem}>
                <Ionicons name="wallet-outline" size={20} color={theme.colors.primary} />
                <Text style={[styles.monthlyStatValue, { color: theme.colors.onSurface }]}>
                  {formatCurrency(driverStats.thisMonthEarnings)} earned
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Account Settings */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Account Settings
            </Text>
            
            <List.Item
              title="Earnings"
              description="View detailed earnings and payments"
              left={(props) => <List.Icon {...props} icon="wallet-outline" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleViewEarnings}
            />
            
            <List.Item
              title="Documents"
              description="Manage your driving license and documents"
              left={(props) => <List.Icon {...props} icon="file-document-outline" />}
              right={(props) => (
                <View style={styles.listItemRight}>
                  <Badge size={16} style={{ backgroundColor: '#EF4444' }} />
                  <List.Icon {...props} icon="chevron-right" />
                </View>
              )}
              onPress={handleViewDocuments}
            />
            
            <List.Item
              title="Vehicle Information"
              description="Update vehicle details and registration"
              left={(props) => <List.Icon {...props} icon="truck-outline" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleVehicleInfo}
            />
          </Card.Content>
        </Card>

        {/* Notification Settings */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Notification Settings
            </Text>
            
            <List.Item
              title="New Consignments"
              description="Get notified about new delivery assignments"
              left={(props) => <List.Icon {...props} icon="bell-outline" />}
              right={() => (
                <Switch
                  value={notificationSettings.newConsignments}
                  onValueChange={() => handleNotificationToggle('newConsignments')}
                />
              )}
            />
            
            <List.Item
              title="Delivery Reminders"
              description="Reminders for upcoming deliveries"
              left={(props) => <List.Icon {...props} icon="clock-outline" />}
              right={() => (
                <Switch
                  value={notificationSettings.deliveryReminders}
                  onValueChange={() => handleNotificationToggle('deliveryReminders')}
                />
              )}
            />
            
            <List.Item
              title="Route Updates"
              description="Traffic and route optimization alerts"
              left={(props) => <List.Icon {...props} icon="map-marker-path" />}
              right={() => (
                <Switch
                  value={notificationSettings.routeUpdates}
                  onValueChange={() => handleNotificationToggle('routeUpdates')}
                />
              )}
            />
            
            <List.Item
              title="Earnings Updates"
              description="Payment confirmations and earning reports"
              left={(props) => <List.Icon {...props} icon="cash" />}
              right={() => (
                <Switch
                  value={notificationSettings.earnings}
                  onValueChange={() => handleNotificationToggle('earnings')}
                />
              )}
            />
            
            <List.Item
              title="Promotions"
              description="Special offers and bonus opportunities"
              left={(props) => <List.Icon {...props} icon="gift-outline" />}
              right={() => (
                <Switch
                  value={notificationSettings.promotions}
                  onValueChange={() => handleNotificationToggle('promotions')}
                />
              )}
            />
            
            <List.Item
              title="System Updates"
              description="App updates and maintenance notifications"
              left={(props) => <List.Icon {...props} icon="update" />}
              right={() => (
                <Switch
                  value={notificationSettings.systemUpdates}
                  onValueChange={() => handleNotificationToggle('systemUpdates')}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* General Settings */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              General Settings
            </Text>
            
            <List.Item
              title="Language"
              description="English"
              left={(props) => <List.Icon {...props} icon="translate" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Alert.alert('Language', 'Language selection will be implemented.')}
            />
            
            <List.Item
              title="Dark Mode"
              description="Switch between light and dark themes"
              left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
              right={() => (
                <Switch
                  value={isDarkMode}
                  onValueChange={setIsDarkMode}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Support & Emergency */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Support & Emergency
            </Text>
            
            <List.Item
              title="Emergency Contact"
              description="24/7 emergency support hotline"
              left={(props) => <List.Icon {...props} icon="phone-alert" color="#EF4444" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleEmergencyContact}
            />
            
            <List.Item
              title="Help & Support"
              description="Get help with app issues"
              left={(props) => <List.Icon {...props} icon="help-circle-outline" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleSupport}
            />
            
            <List.Item
              title="Privacy Policy"
              description="Read our privacy policy"
              left={(props) => <List.Icon {...props} icon="shield-account-outline" />}
              right={(props) => <List.Icon {...props} icon="open-in-new" />}
              onPress={handlePrivacyPolicy}
            />
            
            <List.Item
              title="Terms of Service"
              description="Read our terms of service"
              left={(props) => <List.Icon {...props} icon="file-document-outline" />}
              right={(props) => <List.Icon {...props} icon="open-in-new" />}
              onPress={handleTermsOfService}
            />
          </Card.Content>
        </Card>

        {/* Danger Zone */}
        <Card style={[styles.card, styles.dangerCard, { backgroundColor: theme.colors.errorContainer }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onErrorContainer }]}>
              Danger Zone
            </Text>
            
            <Button
              mode="outlined"
              onPress={handleLogout}
              style={[styles.dangerButton, { borderColor: theme.colors.error }]}
              textColor={theme.colors.error}
              icon="logout"
            >
              Logout
            </Button>
            
            <Button
              mode="outlined"
              onPress={handleDeleteAccount}
              style={[styles.dangerButton, { borderColor: theme.colors.error }]}
              textColor={theme.colors.error}
              icon="delete-forever"
            >
              Delete Account
            </Button>
          </Card.Content>
        </Card>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.onSurfaceVariant }]}>
            Mawell Driver App v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  userDetails: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    marginRight: 8,
  },
  statusSwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  divider: {
    marginVertical: 16,
  },
  monthlyStats: {
    gap: 8,
  },
  monthlyStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthlyStatValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  listItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dangerCard: {
    marginTop: 8,
  },
  dangerButton: {
    marginBottom: 8,
  },
  footer: {
    alignItems: 'center',
    padding: 24,
  },
  footerText: {
    fontSize: 12,
  },
});