import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import CameraScreen from './screens/CameraScreen';
import ResultScreen from './screens/ResultScreen';
import HistoryScreen from './screens/HistoryScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Camera"
        screenOptions={{
          headerStyle: { backgroundColor: '#1a1007' },
          headerTintColor: '#F5A623',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen
          name="Camera"
          component={CameraScreen}
          options={{ title: '🐝 HiveIQ Scanner' }}
        />
        <Stack.Screen
          name="Result"
          component={ResultScreen}
          options={{ title: '📋 Diagnosis Result' }}
        />
        <Stack.Screen
          name="History"
          component={HistoryScreen}
          options={{ title: '📊 Hive History' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}