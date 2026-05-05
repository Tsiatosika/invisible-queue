import React from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl
} from 'react-native'
import { useAuth } from '../context/AuthContext'
import { useQueues } from '../hooks/useQueues'
import { useLocation } from '../hooks/useLocation'
import QueueCard from '../components/QueueCard'

export default function HomeScreen({ navigation }) {
  const { user, signOut } = useAuth()
  const { queues, loading, fetchQueues } = useQueues()
  const { location, loading: locLoading, getDistance, isNearby } = useLocation()

  const nearbyQueues = location
    ? queues.filter(q => isNearby(q.latitude, q.longitude, 50000))
    : queues

  const handleSignOut = async () => {
    await signOut()
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
  }

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>📍</Text>
      <Text style={styles.emptyTitle}>Aucune file disponible</Text>
      <Text style={styles.emptyText}>
        Aucune file d'attente n'est disponible pour le moment.
      </Text>
    </View>
  )

  if (locLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Invisible Queue</Text>
          <Text style={styles.subtitle}>
            {user ? `👤 ${user.email}` : '👤 Mode invité'}
          </Text>
        </View>
        <View style={styles.headerButtons}>
          {user && (
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => navigation.navigate('CreateQueue')}
            >
              <Text style={styles.createBtnText}>＋</Text>
            </TouchableOpacity>
          )}
          {user ? (
            <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
              <Text style={styles.logoutText}>Déco</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginText}>Connexion</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.countBar}>
        <Text style={styles.countText}>
          📍 {nearbyQueues.length} file{nearbyQueues.length !== 1 ? 's' : ''} disponible{nearbyQueues.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={nearbyQueues}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <QueueCard
              queue={item}
              distance={location ? getDistance(
                location.latitude, location.longitude,
                item.latitude, item.longitude
              ) : 0}
              onPress={() => navigation.navigate('QueueDetail', { queue: item })}
            />
          )}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchQueues} />
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#666', fontSize: 14 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#4f46e5',
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 12, color: '#c7d2fe', marginTop: 2 },
  headerButtons: { flexDirection: 'row', gap: 8 },
  createBtn: {
    backgroundColor: '#fff',
    width: 36, height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createBtnText: { color: '#4f46e5', fontSize: 20, fontWeight: 'bold' },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  logoutText: { color: '#fff', fontSize: 13 },
  loginBtn: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  loginText: { color: '#4f46e5', fontSize: 13, fontWeight: '600' },
  countBar: { backgroundColor: '#ede9fe', padding: 10, alignItems: 'center' },
  countText: { color: '#4f46e5', fontWeight: '600', fontSize: 13 },
  list: { padding: 16, paddingBottom: 40 },
  empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#999', textAlign: 'center', lineHeight: 20 },
})