import 'react-native-url-polyfill/auto'
import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { ActivityIndicator, View, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

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
const Tab = createBottomTabNavigator()

// Stack pour l'onglet Home
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="QueueDetail" component={QueueDetailScreen} />
      <Stack.Screen name="Tracking" component={TrackingScreen} />
      <Stack.Screen name="QueueManager" component={QueueManagerScreen} />
    </Stack.Navigator>
  )
}

// Stack pour l'onglet Créer
function CreateStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CreateQueueScreen" component={CreateQueueScreen} />
    </Stack.Navigator>
  )
}

// Stack pour l'onglet Profil
function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
      <Stack.Screen name="CreateQueue" component={CreateQueueScreen} />
    </Stack.Navigator>
  )
}

// Tabs principaux
function MainTabs() {
  const { user } = useAuth()
  const { theme, isDark } = useTheme()

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: theme.subtext,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 6,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName
          if (route.name === 'Home') {
            iconName = focused ? 'list' : 'list-outline'
          } else if (route.name === 'Create') {
            iconName = focused ? 'add-circle' : 'add-circle-outline'
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person-circle' : 'person-circle-outline'
          }
          return <Ionicons name={iconName} size={24} color={color} />
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{ tabBarLabel: 'Files' }}
      />
      {user && (
        <Tab.Screen
          name="Create"
          component={CreateStack}
          options={{ tabBarLabel: 'Créer' }}
        />
      )}
      <Tab.Screen
        name="Profile"
        component={user ? ProfileStack : LoginScreen}
        options={{
          tabBarLabel: user ? 'Profil' : 'Connexion',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={user
                ? (focused ? 'person-circle' : 'person-circle-outline')
                : (focused ? 'log-in' : 'log-in-outline')
              }
              size={24}
              color={color}
            />
          )
        }}
      />
    </Tab.Navigator>
  )
}

// Navigation principale
function RootNavigator() {
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
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="NotFound" component={NotFoundScreen} />
    </Stack.Navigator>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </ThemeProvider>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
})