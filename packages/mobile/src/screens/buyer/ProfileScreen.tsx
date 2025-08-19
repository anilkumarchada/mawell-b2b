import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useTheme,
  ActivityIndicator,
  Card,
  List,
  Switch,
  Button,
  Avatar,
  Divider,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { BuyerStackParamList } from '@/navigation/BuyerNavigator';
import { AuthContext } from '@/store/AuthContext';
import { User } from '@/types';

type ProfileScreenNavigationProp = StackNavigationProp<
  BuyerStackParamList,
  'Profile'
>;

interface Props {
  navigation: ProfileScreenNavigationProp;
}

interface ProfileStats {
  totalOrders: number;
  totalSpent: number;
  savedItems: number;
  loyaltyPoints: number;
}

interface NotificationSettings {
  orderUpdates: boolean;
  promotions: boolean;
  newProducts: boolean;
  priceDrops: boolean;
}

// Mock data
const mockStats: ProfileStats = {
  totalOrders: 24,
  totalSpent: 45670,
  savedItems: 12,
  loyaltyPoints: 2340,
};

const mockNotificationSettings: NotificationSettings = {
  orderUpdates: true,
  promotions: true,
  newProducts: false,
  priceDrops: true,
};

export function ProfileScreen({ navigation }: Props) {
  const theme = useTheme();
  const { user, logout } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<ProfileStats>(mockStats);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(mockNotificationSettings);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      // Load profile stats and settings
      // const [statsData, settingsData] = await Promise.all([
      //   userService.getProfileStats(),
      //   userService.getNotificationSettings(),
      // ]);
      // setStats(statsData);
      // setNotificationSettings(settingsData);
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleAddressManagement = () => {
    navigation.navigate('AddressManagement');
  };

  const handlePaymentMethods = () => {
    navigation.navigate('PaymentMethods');
  };

  const handleOrderHistory = () => {
    navigation.navigate('Orders');
  };

  const handleWishlist = () => {
    navigation.navigate('Wishlist');
  };

  const handleNotificationToggle = async (key: keyof NotificationSettings, value: boolean) => {
    try {
      const updatedSettings = { ...notificationSettings, [key]: value };
      setNotificationSettings(updatedSettings);
      
      // Update notification settings on server
      // await userService.updateNotificationSettings(updatedSettings);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      // Revert on error
      setNotificationSettings(notificationSettings);
    }
  };

  const handleLanguageSettings = () => {
    Alert.alert(
      'Language Settings',
      'Select your preferred language',
      [
        { text: 'English', onPress: () => console.log('English selected') },
        { text: 'हिंदी', onPress: () => console.log('Hindi selected') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleThemeSettings = () => {
    Alert.alert(
      'Theme Settings',
      'Select your preferred theme',
      [
        { text: 'Light', onPress: () => console.log('Light theme selected') },
        { text: 'Dark', onPress: () => console.log('Dark theme selected') },
        { text: 'System', onPress: () => console.log('System theme selected') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handlePrivacyPolicy = () => {
    // Navigate to privacy policy or open web view
    console.log('Privacy Policy');
  };

  const handleTermsOfService = () => {
    // Navigate to terms of service or open web view
    console.log('Terms of Service');
  };

  const handleHelpSupport = () => {
    Alert.alert(
      'Help & Support',
      'How can we help you?',
      [
        { text: 'FAQ', onPress: () => console.log('FAQ') },
        { text: 'Contact Support', onPress: () => console.log('Contact Support') },
        { text: 'Live Chat', onPress: () => console.log('Live Chat') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
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
            Alert.alert(
              'Confirm Deletion',
              'Type "DELETE" to confirm account deletion',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Confirm',
                  style: 'destructive',
                  onPress: () => {
                    // Implement account deletion
                    console.log('Delete account');
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const renderProfileHeader = () => (
    <Card style={styles.profileCard}>
      <Card.Content>
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={handleEditProfile}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <Avatar.Text
                size={80}
                label={`${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`}
                style={styles.avatarText}
              />
            )}
          </TouchableOpacity>
          
          <View style={styles.profileInfo}>
            <Text style={[styles.userName, { color: theme.colors.onSurface }]}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text style={[styles.userEmail, { color: theme.colors.onSurfaceVariant }]}>
              {user?.email}
            </Text>
            <Text style={[styles.userPhone, { color: theme.colors.onSurfaceVariant }]}>
              {user?.phone}
            </Text>
            
            <Button
              mode="outlined"
              onPress={handleEditProfile}
              style={styles.editButton}
              compact
            >
              Edit Profile
            </Button>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderStats = () => (
    <Card style={styles.statsCard}>
      <Card.Content>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Your Stats
        </Text>
        
        <View style={styles.statsGrid}>
          <TouchableOpacity style={styles.statItem} onPress={handleOrderHistory}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {stats.totalOrders}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
              Total Orders
            </Text>
          </TouchableOpacity>
          
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              ₹{stats.totalSpent.toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
              Total Spent
            </Text>
          </View>
          
          <TouchableOpacity style={styles.statItem} onPress={handleWishlist}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {stats.savedItems}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
              Saved Items
            </Text>
          </TouchableOpacity>
          
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {stats.loyaltyPoints}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
              Loyalty Points
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderAccountSection = () => (
    <Card style={styles.section}>
      <Card.Content>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Account
        </Text>
        
        <List.Item
          title="Order History"
          description="View all your orders"
          left={(props) => <List.Icon {...props} icon="receipt" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={handleOrderHistory}
        />
        
        <List.Item
          title="Address Management"
          description="Manage delivery addresses"
          left={(props) => <List.Icon {...props} icon="map-marker" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={handleAddressManagement}
        />
        
        <List.Item
          title="Payment Methods"
          description="Manage payment options"
          left={(props) => <List.Icon {...props} icon="credit-card" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={handlePaymentMethods}
        />
        
        <List.Item
          title="Wishlist"
          description="Your saved items"
          left={(props) => <List.Icon {...props} icon="heart" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={handleWishlist}
        />
      </Card.Content>
    </Card>
  );

  const renderNotificationSettings = () => (
    <Card style={styles.section}>
      <Card.Content>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Notifications
        </Text>
        
        <List.Item
          title="Order Updates"
          description="Get notified about order status"
          left={(props) => <List.Icon {...props} icon="bell" />}
          right={() => (
            <Switch
              value={notificationSettings.orderUpdates}
              onValueChange={(value) => handleNotificationToggle('orderUpdates', value)}
            />
          )}
        />
        
        <List.Item
          title="Promotions"
          description="Receive promotional offers"
          left={(props) => <List.Icon {...props} icon="tag" />}
          right={() => (
            <Switch
              value={notificationSettings.promotions}
              onValueChange={(value) => handleNotificationToggle('promotions', value)}
            />
          )}
        />
        
        <List.Item
          title="New Products"
          description="Get notified about new arrivals"
          left={(props) => <List.Icon {...props} icon="package-variant" />}
          right={() => (
            <Switch
              value={notificationSettings.newProducts}
              onValueChange={(value) => handleNotificationToggle('newProducts', value)}
            />
          )}
        />
        
        <List.Item
          title="Price Drops"
          description="Get notified about price reductions"
          left={(props) => <List.Icon {...props} icon="trending-down" />}
          right={() => (
            <Switch
              value={notificationSettings.priceDrops}
              onValueChange={(value) => handleNotificationToggle('priceDrops', value)}
            />
          )}
        />
      </Card.Content>
    </Card>
  );

  const renderPreferencesSection = () => (
    <Card style={styles.section}>
      <Card.Content>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Preferences
        </Text>
        
        <List.Item
          title="Language"
          description="English"
          left={(props) => <List.Icon {...props} icon="translate" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={handleLanguageSettings}
        />
        
        <List.Item
          title="Theme"
          description="System default"
          left={(props) => <List.Icon {...props} icon="palette" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={handleThemeSettings}
        />
      </Card.Content>
    </Card>
  );

  const renderSupportSection = () => (
    <Card style={styles.section}>
      <Card.Content>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Support & Legal
        </Text>
        
        <List.Item
          title="Help & Support"
          description="Get help with your account"
          left={(props) => <List.Icon {...props} icon="help-circle" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={handleHelpSupport}
        />
        
        <List.Item
          title="Privacy Policy"
          description="Read our privacy policy"
          left={(props) => <List.Icon {...props} icon="shield-account" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={handlePrivacyPolicy}
        />
        
        <List.Item
          title="Terms of Service"
          description="Read our terms of service"
          left={(props) => <List.Icon {...props} icon="file-document" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={handleTermsOfService}
        />
      </Card.Content>
    </Card>
  );

  const renderDangerZone = () => (
    <Card style={[styles.section, styles.dangerSection]}>
      <Card.Content>
        <Text style={[styles.sectionTitle, { color: theme.colors.error }]}>
          Danger Zone
        </Text>
        
        <Button
          mode="outlined"
          onPress={handleLogout}
          style={[styles.dangerButton, { borderColor: theme.colors.error }]}
          labelStyle={{ color: theme.colors.error }}
          icon="logout"
        >
          Logout
        </Button>
        
        <Button
          mode="outlined"
          onPress={handleDeleteAccount}
          style={[styles.dangerButton, { borderColor: theme.colors.error }]}
          labelStyle={{ color: theme.colors.error }}
          icon="delete"
        >
          Delete Account
        </Button>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {renderProfileHeader()}
        {renderStats()}
        {renderAccountSection()}
        {renderNotificationSettings()}
        {renderPreferencesSection()}
        {renderSupportSection()}
        {renderDangerZone()}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    margin: 16,
    marginBottom: 8,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  avatarText: {
    marginRight: 16,
  },
  profileInfo: {
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
    marginBottom: 12,
  },
  editButton: {
    alignSelf: 'flex-start',
  },
  statsCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
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
  section: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  dangerSection: {
    borderColor: '#EF4444',
    borderWidth: 1,
  },
  dangerButton: {
    marginBottom: 12,
  },
  bottomSpacing: {
    height: 32,
  },
});