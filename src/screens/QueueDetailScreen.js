import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, Modal
} from 'react-native'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../../lib/supabase'
import GuestForm from '../components/GuestForm'

export default function QueueDetailScreen({ route, navigation }) {
  const { queue: initialQueue } = route.params
  const { user } = useAuth()
  const [queue, setQueue] = useState(initialQueue)
  const [loading, setLoading] = useState(false)
  const [showGuestForm, setShowGuestForm] = useState(false)
  const [entryCount, setEntryCount] = useState(0)
  const channelRef = useRef(null)

  useEffect(() => {
    fetchCount()

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabase
      .channel('detail_' + Date.now())
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'queue_entries',
      }, () => fetchCount())
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [])

  const fetchCount = async () => {
    const { count } = await supabase
      .from('queue_entries')
      .select('*', { count: 'exact', head: true })
      .eq('queue_id', initialQueue.id)
      .eq('status', 'waiting')
    setEntryCount(count ?? 0)
  }

  const handleJoin = async (guestName, guestEmail) => {
    setLoading(true)
    try {
      const { data: entries } = await supabase
        .from('queue_entries')
        .select('position')
        .eq('queue_id', initialQueue.id)
        .eq('status', 'waiting')
        .order('position', { ascending: false })
        .limit(1)

      const nextPosition = entries && entries.length > 0
        ? entries[0].position + 1 : 1

      const entryData = {
        queue_id: initialQueue.id,
        position: nextPosition,
        status: 'waiting',
        missed_turns: 0,
      }

      if (user) {
        entryData.user_id = user.id
      } else {
        entryData.guest_name = guestName
        entryData.guest_email = guestEmail
      }

      const { data: entry, error } = await supabase
        .from('queue_entries')
        .insert(entryData)
        .select()
        .single()

      if (error) throw error

      navigation.replace('Tracking', { entry, queue: initialQueue })
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const waitMinutes = entryCount * 5

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{queue.name}</Text>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>En direct</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.card}>
        <View style={styles.statRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{entryCount}</Text>
            <Text style={styles.statLabel}>👥 En attente</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>~{waitMinutes} min</Text>
            <Text style={styles.statLabel}>⏱️ Temps estimé</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>#{entryCount + 1}</Text>
            <Text style={styles.statLabel}>📍 Votre position</Text>
          </View>
        </View>
      </View>

      {/* Info utilisateur */}
      <View style={styles.infoBox}>
        {user ? (
          <Text style={styles.infoText}>
            ✅ Connecté en tant que <Text style={styles.infoEmail}>{user.email}</Text>
          </Text>
        ) : (
          <Text style={styles.infoText}>
            👤 Mode invité — vos informations seront demandées
          </Text>
        )}
      </View>

      {/* Formulaire invité ou bouton */}
      {!showGuestForm ? (
        <TouchableOpacity
          style={[styles.joinBtn, loading && styles.joinBtnDisabled]}
          onPress={() => user ? handleJoin(null, null) : setShowGuestForm(true)}
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

      {!user && !showGuestForm && (
        <TouchableOpacity
          style={styles.loginHint}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginHintText}>
            Déjà un compte ? <Text style={styles.loginHintLink}>Se connecter</Text>
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    backgroundColor: '#4f46e5',
    padding: 20, paddingTop: 40,
  },
  backBtn: { marginBottom: 12 },
  backText: { color: '#c7d2fe', fontSize: 14 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  liveDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#4ade80', marginRight: 6,
  },
  liveText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  card: {
    backgroundColor: '#fff', margin: 16,
    borderRadius: 16, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around', alignItems: 'center',
  },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 22, fontWeight: '800', color: '#4f46e5', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#999', textAlign: 'center' },
  divider: { width: 1, height: 40, backgroundColor: '#eee' },
  infoBox: {
    backgroundColor: '#ede9fe',
    marginHorizontal: 16, borderRadius: 12, padding: 14,
  },
  infoText: { color: '#4f46e5', fontSize: 14 },
  infoEmail: { fontWeight: '700' },
  joinBtn: {
    backgroundColor: '#4f46e5',
    margin: 16, borderRadius: 16,
    padding: 18, alignItems: 'center',
  },
  joinBtnDisabled: { backgroundColor: '#a5b4fc' },
  joinBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  loginHint: { alignItems: 'center', marginBottom: 24 },
  loginHintText: { color: '#999', fontSize: 13 },
  loginHintLink: { color: '#4f46e5', fontWeight: '600' },
})