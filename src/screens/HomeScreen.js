import React, { useEffect, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import QueueCard from '../components/QueueCard'
import { supabase } from '../../lib/supabase'

export default function HomeScreen({ navigation }) {
  const { user, signOut } = useAuth()
  const [queues, setQueues] = useState([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => { loadQueues() }, [])

  const loadQueues = async () => {
    setFetching(true)
    const { data, error } = await supabase
      .from('queues')
      .select('*, queue_entries(count)')
      .order('created_at', { ascending: false })
    if (!error && data) setQueues(data)
    setFetching(false)
  }

  const handleSignOut = async () => {
    await signOut()
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
  }

  if (fetching) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Invisible Queue</Text>
          <View style={styles.userRow}>
            <Ionicons
              name={user ? 'person-circle-outline' : 'person-outline'}
              size={14} color="#c7d2fe"
            />
            <Text style={styles.subtitle}>
              {' '}{user ? user.email : 'Mode invité'}
            </Text>
          </View>
        </View>
        <View style={styles.headerButtons}>
          {user && (
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.navigate('CreateQueue')}
            >
              <Ionicons name="add" size={24} color="#4f46e5" />
            </TouchableOpacity>
          )}
          {user ? (
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate("Profile")}>
              <Ionicons name="person-circle-outline" size={22} color="#4f46e5" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => navigation.navigate('Login')}
            >
              <Ionicons name="log-in-outline" size={16} color="#4f46e5" />
              <Text style={styles.loginText}> Connexion</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Compteur */}
      <View style={styles.countBar}>
        <Ionicons name="list-outline" size={14} color="#4f46e5" />
        <Text style={styles.countText}>
          {' '}{queues.length} file{queues.length !== 1 ? 's' : ''} disponible{queues.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Liste */}
      <FlatList
        data={queues}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <QueueCard
            queue={item}
            distance={0}
            onPress={() => navigation.navigate('QueueDetail', { queue: item })}
            onManage={
              user && item.created_by === user.id
                ? () => navigation.navigate('QueueManager', { queue: item })
                : null
            }
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="location-outline" size={64} color="#c7d2fe" />
            <Text style={styles.emptyTitle}>Aucune file disponible</Text>
            <Text style={styles.emptyText}>
              Aucune file d'attente n'est disponible pour le moment.
            </Text>
          </View>
        }
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={fetching} onRefresh={loadQueues} />
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#666', fontSize: 14 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 20, paddingTop: 40,
    backgroundColor: '#4f46e5',
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  userRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  subtitle: { fontSize: 12, color: '#c7d2fe' },
  headerButtons: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  iconBtn: {
    backgroundColor: '#fff',
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center',
  },
  loginBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  loginText: { color: '#4f46e5', fontSize: 13, fontWeight: '600' },
  countBar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ede9fe', padding: 10,
  },
  countText: { color: '#4f46e5', fontWeight: '600', fontSize: 13 },
  list: { padding: 16, paddingBottom: 40 },
  empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginTop: 16 },
  emptyText: { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 8, lineHeight: 20 },
})