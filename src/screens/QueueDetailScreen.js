import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../../lib/supabase'
import GuestForm from '../components/GuestForm'

export default function QueueDetailScreen({ route, navigation }) {
  const { queue: initialQueue } = route.params
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showGuestForm, setShowGuestForm] = useState(false)
  const [entryCount, setEntryCount] = useState(0)
  const [alreadyInQueue, setAlreadyInQueue] = useState(false)
  const [myEntry, setMyEntry] = useState(null)
  const channelRef = useRef(null)

  useEffect(() => {
    fetchData()

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabase
      .channel('detail_' + Date.now())
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'queue_entries',
      }, () => fetchData())
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [])

  const fetchData = async () => {
    // Compte total
    const { count } = await supabase
      .from('queue_entries')
      .select('*', { count: 'exact', head: true })
      .eq('queue_id', initialQueue.id)
      .eq('status', 'waiting')
    setEntryCount(count ?? 0)

    // Vérifie si déjà inscrit (utilisateur connecté)
    if (user) {
      const { data: existing } = await supabase
        .from('queue_entries')
        .select('*')
        .eq('queue_id', initialQueue.id)
        .eq('user_id', user.id)
        .eq('status', 'waiting')
        .maybeSingle()

      if (existing) {
        setAlreadyInQueue(true)
        setMyEntry(existing)
      } else {
        setAlreadyInQueue(false)
        setMyEntry(null)
      }
    }
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
          <Ionicons name="arrow-back-outline" size={20} color="#c7d2fe" />
          <Text style={styles.backText}> Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{initialQueue.name}</Text>
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
            <Text style={styles.statLabel}>En attente</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>~{waitMinutes} min</Text>
            <Text style={styles.statLabel}>Temps estimé</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>#{entryCount + 1}</Text>
            <Text style={styles.statLabel}>Votre position</Text>
          </View>
        </View>
      </View>

      {/* Déjà inscrit */}
      {alreadyInQueue && myEntry ? (
        <View style={styles.alreadyBox}>
          <Ionicons name="information-circle-outline" size={20} color="#4f46e5" />
          <Text style={styles.alreadyText}>
            {' '}Vous êtes déjà en position #{myEntry.position} dans cette file.
          </Text>
        </View>
      ) : (
        <View style={styles.infoBox}>
          {user ? (
            <View style={styles.infoRow}>
              <Ionicons name="person-circle-outline" size={16} color="#4f46e5" />
              <Text style={styles.infoText}>
                {' '}Connecté en tant que{' '}
                <Text style={styles.infoEmail}>{user.email}</Text>
              </Text>
            </View>
          ) : (
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={16} color="#4f46e5" />
              <Text style={styles.infoText}>
                {' '}Mode invité — vos informations seront demandées
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Bouton rejoindre ou retourner au suivi */}
      {alreadyInQueue && myEntry ? (
        <TouchableOpacity
          style={styles.trackingBtn}
          onPress={() => navigation.replace('Tracking', {
            entry: myEntry,
            queue: initialQueue
          })}
        >
          <Ionicons name="timer-outline" size={20} color="#fff" />
          <Text style={styles.trackingBtnText}> Voir mon suivi</Text>
        </TouchableOpacity>
      ) : !showGuestForm ? (
        <TouchableOpacity
          style={[styles.joinBtn, loading && styles.joinBtnDisabled]}
          onPress={() => user ? handleJoin(null, null) : setShowGuestForm(true)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons
                name={user ? 'checkmark-circle-outline' : 'person-add-outline'}
                size={20} color="#fff"
              />
              <Text style={styles.joinBtnText}>
                {' '}{user ? 'Rejoindre la file' : 'Rejoindre en invité'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      ) : (
        <GuestForm onSubmit={handleJoin} loading={loading} />
      )}

      {!user && !showGuestForm && !alreadyInQueue && (
        <TouchableOpacity
          style={styles.loginHint}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginHintText}>
            Déjà un compte ?{' '}
            <Text style={styles.loginHintLink}>Se connecter</Text>
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { backgroundColor: '#4f46e5', padding: 20, paddingTop: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
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
    backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  statRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 22, fontWeight: '800', color: '#4f46e5', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#999', textAlign: 'center' },
  divider: { width: 1, height: 40, backgroundColor: '#eee' },
  alreadyBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#ede9fe', marginHorizontal: 16,
    borderRadius: 12, padding: 14, marginBottom: 4,
  },
  alreadyText: { color: '#4f46e5', fontSize: 14, flex: 1 },
  infoBox: {
    backgroundColor: '#ede9fe',
    marginHorizontal: 16, borderRadius: 12, padding: 14,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoText: { color: '#4f46e5', fontSize: 14, flex: 1 },
  infoEmail: { fontWeight: '700' },
  trackingBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#22c55e', margin: 16, borderRadius: 16, padding: 18,
  },
  trackingBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  joinBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#4f46e5', margin: 16, borderRadius: 16, padding: 18,
  },
  joinBtnDisabled: { backgroundColor: '#a5b4fc' },
  joinBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  loginHint: { alignItems: 'center', marginBottom: 24 },
  loginHintText: { color: '#999', fontSize: 13 },
  loginHintLink: { color: '#4f46e5', fontWeight: '600' },
})