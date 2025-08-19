import React, { useState, useRef, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '@/navigation/AuthNavigator';
import { AuthContext } from '@/store/AuthContext';

const { width, height } = Dimensions.get('window');

type OnboardingScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'Onboarding'
>;

interface Props {
  navigation: OnboardingScreenNavigationProp;
}

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const onboardingSlides: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Welcome to MAWELL',
    description: 'Your complete B2B supply chain solution. Streamline your business operations with our comprehensive platform.',
    icon: 'cube',
    color: '#667eea',
  },
  {
    id: '2',
    title: 'Browse & Order',
    description: 'Discover thousands of products from verified suppliers. Place orders with just a few taps and track them in real-time.',
    icon: 'storefront',
    color: '#4CAF50',
  },
  {
    id: '3',
    title: 'Fast Delivery',
    description: 'Get your orders delivered quickly and safely. Our network of professional drivers ensures timely delivery.',
    icon: 'car',
    color: '#2196F3',
  },
  {
    id: '4',
    title: 'Manage Operations',
    description: 'Keep track of inventory, monitor orders, and generate insights to grow your business efficiently.',
    icon: 'analytics',
    color: '#FF9800',
  },
];

export function OnboardingScreen({ navigation }: Props) {
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < onboardingSlides.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    handleGetStarted();
  };

  const handleGetStarted = () => {
    // Navigation will be handled by AppNavigator based on user role
    // This screen will be unmounted when onboarding is complete
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={[styles.slide, { width }]}>
      <View style={styles.slideContent}>
        {/* Icon */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${item.color}20` },
          ]}
        >
          <Ionicons name={item.icon} size={80} color={item.color} />
        </View>

        {/* Content */}
        <View style={styles.textContent}>
          <Text
            style={[
              styles.slideTitle,
              { color: theme.colors.onBackground },
            ]}
          >
            {item.title}
          </Text>
          <Text
            style={[
              styles.slideDescription,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {item.description}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderPagination = () => (
    <View style={styles.pagination}>
      {onboardingSlides.map((_, index) => (
        <View
          key={index}
          style={[
            styles.paginationDot,
            {
              backgroundColor:
                index === currentIndex
                  ? theme.colors.primary
                  : theme.colors.outline,
              width: index === currentIndex ? 24 : 8,
            },
          ]}
        />
      ))}
    </View>
  );

  const isLastSlide = currentIndex === onboardingSlides.length - 1;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.welcomeText, { color: theme.colors.onSurfaceVariant }]}>
          Welcome, {user?.firstName || 'User'}!
        </Text>
        {!isLastSlide && (
          <Button
            mode="text"
            onPress={handleSkip}
            labelStyle={[styles.skipText, { color: theme.colors.primary }]}
          >
            Skip
          </Button>
        )}
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={onboardingSlides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50,
        }}
        style={styles.slidesList}
      />

      {/* Footer */}
      <View style={styles.footer}>
        {renderPagination()}
        
        <Button
          mode="contained"
          onPress={handleNext}
          style={styles.nextButton}
          contentStyle={styles.nextButtonContent}
          labelStyle={styles.nextButtonText}
        >
          {isLastSlide ? 'Get Started' : 'Next'}
        </Button>
      </View>
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  slidesList: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
    maxWidth: width - 80,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
  },
  textContent: {
    alignItems: 'center',
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  slideDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    gap: 8,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    borderRadius: 12,
  },
  nextButtonContent: {
    height: 56,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});