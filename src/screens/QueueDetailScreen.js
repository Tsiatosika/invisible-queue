import React, { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView
} from 'react-native'
import { useAuth } from '../context/AuthContext'
import { useQueues } from '../hooks/useQueues'
import { useLocation } from '../hooks/useLocation'
import GuestForm from '../components/GuestForm'

export default function QueueDetailScreen({ route, navigation }) {
  const { queue } = route.params
  const { user } = useAuth()
  const { joinQueue } = useQueues()
  const { isNearby } = useLocation()
  const [loading, setLoading] = useState(false)
  const [showGuestForm, setShowGuestForm] = useState(false)

  const count = queue.queue_entries?.[0]?.count ?? 0
  const waitMinutes = count * 5

  const handleJoin = async (guestName, guestEmail) => {
    setLoading(true)
    try {
      const entry = await joinQueue(
        queue.id,
        user?.id || null,
        guestName,
        guestEmail
      )
      navigation.replace('Tracking', { entry, queue })
    } catch (error) {
      Alert.alert('Erreur', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinPress = () => {
    if (user) {
      handleJoin(null, null)
    } else {
      setShowGuestForm(true)
    }
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{queue.name}</Text>
      </View>

      {/* Infos */}
      <View style={styles.card}>
        <View style={styles.statRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{count}</Text>
            <Text style={styles.statLabel}>👥 En attente</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>~{waitMinutes} min</Text>
            <Text style={styles.statLabel}>⏱️ Temps estimé</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>#{count + 1}</Text>
            <Text style={styles.statLabel}>📍 Votre position</Text>
          </View>
        </View>
      </View>

      {/* Formulaire invité ou bouton */}
      {!showGuestForm ? (
        <TouchableOpacity
          style={styles.joinBtn}
          onPress={handleJoinPress}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.joinBtnText}>
              {user ? '✅ Rejoindre la file' : '👤 Rejoindre en invité'}
            </Text>
          )}
        </TouchableOpacity>
      ) : (
        <GuestForm onSubmit={handleJoin} loading={loading} />
      )}

      {/* Info mode */}
      {!user && !showGuestForm && (
        <Text style={styles.hint}>
          Vous pouvez aussi{' '}
          <Text
            style={styles.hintLink}
            onPress={() => navigation.navigate('Login')}
          >
            vous connecter
          </Text>{' '}
          pour rejoindre sans ressaisir vos infos.
        </Text>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    backgroundColor: '#4f46e5',
    padding: 20,
    paddingTop: 40,
  },
  backBtn: { marginBottom: 12 },
  backText: { color: '#c7d2fe', fontSize: 14 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 22, fontWeight: '800', color: '#4f46e5', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#999', textAlign: 'center' },
  divider: { width: 1, height: 40, backgroundColor: '#eee' },
  joinBtn: {
    backgroundColor: '#4f46e5',
    margin: 16,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  joinBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  hint: { textAlign: 'center', color: '#999', fontSize: 13, marginHorizontal: 16 },
  hintLink: { color: '#4f46e5', fontWeight: '600' },
})