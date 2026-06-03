import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome } from '@expo/vector-icons';

import AdBanner       from './src/components/AdBanner';
import GuideScreen    from './src/screens/GuideScreen';
import RepelScreen    from './src/screens/RepelScreen';
import ForecastScreen from './src/screens/ForecastScreen';
import MapScreen      from './src/screens/MapScreen';
import ReportScreen   from './src/screens/ReportScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            const icons = {
              '가이드':  'shield',
              '퇴치':    'volume-up',
              '예보':    'calendar',
              '지도':    'map',
              '신고':    'map-marker',
            };
            return <FontAwesome name={icons[route.name]} size={size - 2} color={color} />;
          },
          tabBarActiveTintColor: '#0F6E56',
          tabBarInactiveTintColor: '#B4B2A9',
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 0.5,
            borderTopColor: 'rgba(0,0,0,0.1)',
            paddingBottom: 4,
            height: 56,
          },
          tabBarLabelStyle: { fontSize: 11 },
          headerStyle: {
            backgroundColor: '#fff',
            borderBottomWidth: 0.5,
            borderBottomColor: 'rgba(0,0,0,0.1)',
            elevation: 0, shadowOpacity: 0,
          },
          headerTitleStyle: { fontSize: 16, fontWeight: '500', color: '#1a1a18' },
        })}
      >
        <Tab.Screen name="가이드"  component={GuideScreen}    options={{ title: '대응 가이드' }} />
        <Tab.Screen name="퇴치"    component={RepelScreen}    options={{ title: '퇴치 도구' }} />
        <Tab.Screen name="예보"    component={ForecastScreen} options={{ title: '예보' }} />
        <Tab.Screen name="지도"    component={MapScreen}      options={{ title: '출몰 지도' }} />
        <Tab.Screen name="신고"    component={ReportScreen}   options={{ title: '신고' }} />
      </Tab.Navigator>
      <AdBanner />
      </View>
    </NavigationContainer>
  );
}