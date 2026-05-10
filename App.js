import 'react-native-url-polyfill/auto'
import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ActivityIndicator, View, StyleSheet } from 'react-native'

import { AuthProvider, useAuth } from './src/context/AuthContext'
import { ThemeProvider, useTheme } from './src/context/ThemeContext'
import LoginScreen from './src/screens/LoginScreen'
import HomeScreen from './src/screens/HomeScreen'
import QueueDetailScreen from './src/screens/QueueDetailScreen'
import TrackingScreen from './src/screens/TrackingScreen'
import CreateQueueScreen from './src/screens/CreateQueueScreen'
import QueueManagerScreen from './src/screens/QueueManagerScreen'
import ProfileScreen from './src/screens/ProfileScreen'
import NotFoundScreen from './src/screens/NotFoundScreen'

const Stack = createNativeStackNavigator()

function Navigation() {
  const { loading } = useAuth()
  const { theme } = useTheme()

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    )
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="QueueDetail" component={QueueDetailScreen} />
      <Stack.Screen name="Tracking" component={TrackingScreen} />
      <Stack.Screen name="CreateQueue" component={CreateQueueScreen} />
      <Stack.Screen name="QueueManager" component={QueueManagerScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="NotFound" component={NotFoundScreen} />
    </Stack.Navigator>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NavigationContainer>
          <Navigation />
        </NavigationContainer>
      </AuthProvider>
    </ThemeProvider>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
})
