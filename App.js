import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome } from '@expo/vector-icons';

import GuideScreen from './src/screens/GuideScreen';
import RepelScreen from './src/screens/RepelScreen';
import ForecastScreen from './src/screens/ForecastScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            const icons = {
              '대응 가이드': 'shield',
              '퇴치 도구':   'volume-up',
              '예보':        'calendar',
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
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTitleStyle: { fontSize: 16, fontWeight: '500', color: '#1a1a18' },
        })}
      >
        <Tab.Screen name="대응 가이드" component={GuideScreen} />
        <Tab.Screen name="퇴치 도구"   component={RepelScreen} />
        <Tab.Screen name="예보"        component={ForecastScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
