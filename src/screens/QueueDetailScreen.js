import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../../lib/supabase'
import GuestForm from '../components/GuestForm'

export default function QueueDetailScreen({ route, navigation }) {
  const { queue: initialQueue } = route.params
  const { user } = useAuth()
  const { theme } = useTheme()
  const [loading, setLoading] = useState(false)
  const [showGuestForm, setShowGuestForm] = useState(false)
  const [entryCount, setEntryCount] = useState(0)
  const [alreadyInQueue, setAlreadyInQueue] = useState(false)
  const [myEntry, setMyEntry] = useState(null)
  const channelRef = useRef(null)

  useEffect(() => {
    fetchData()
    if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null }
    const channel = supabase.channel('detail_' + Date.now())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_entries' }, () => fetchData())
      .subscribe()
    channelRef.current = channel
    return () => { if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null } }
  }, [])

  const fetchData = async () => {
    const { count } = await supabase.from('queue_entries').select('*', { count: 'exact', head: true })
      .eq('queue_id', initialQueue.id).eq('status', 'waiting')
    setEntryCount(count ?? 0)
    if (user) {
      const { data: existing } = await supabase.from('queue_entries').select('*')
        .eq('queue_id', initialQueue.id).eq('user_id', user.id).eq('status', 'waiting').maybeSingle()
      if (existing) { setAlreadyInQueue(true); setMyEntry(existing) }
      else { setAlreadyInQueue(false); setMyEntry(null) }
    }
  }

  const handleJoin = async (guestName, guestEmail) => {
    setLoading(true)
    try {
      const { data: entries } = await supabase.from('queue_entries').select('position')
        .eq('queue_id', initialQueue.id).eq('status', 'waiting')
        .order('position', { ascending: false }).limit(1)
      const nextPosition = entries?.length > 0 ? entries[0].position + 1 : 1
      const entryData = { queue_id: initialQueue.id, position: nextPosition, status: 'waiting', missed_turns: 0 }
      if (user) entryData.user_id = user.id
      else { entryData.guest_name = guestName; entryData.guest_email = guestEmail }
      const { data: entry, error } = await supabase.from('queue_entries').insert(entryData).select().single()
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
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { backgroundColor: theme.header }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back-outline" size={20} color={theme.headerSub} />
          <Text style={[styles.backText, { color: theme.headerSub }]}> Retour</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.headerText }]}>{initialQueue.name}</Text>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={[styles.liveText, { color: theme.headerText }]}>En direct</Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
        <View style={styles.statRow}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: theme.countText }]}>{entryCount}</Text>
            <Text style={[styles.statLabel, { color: theme.subtext }]}>En attente</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: theme.countText }]}>~{waitMinutes} min</Text>
            <Text style={[styles.statLabel, { color: theme.subtext }]}>Temps estimé</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: theme.countText }]}>#{entryCount + 1}</Text>
            <Text style={[styles.statLabel, { color: theme.subtext }]}>Votre position</Text>
          </View>
        </View>
      </View>

      {alreadyInQueue && myEntry ? (
        <View style={[styles.alreadyBox, { backgroundColor: theme.badge }]}>
          <Ionicons name="information-circle-outline" size={20} color={theme.countText} />
          <Text style={[styles.alreadyText, { color: theme.countText }]}>
            {' '}Vous êtes déjà en position #{myEntry.position} dans cette file.
          </Text>
        </View>
      ) : (
        <View style={[styles.infoBox, { backgroundColor: theme.badge }]}>
          <View style={styles.infoRow}>
            <Ionicons name={user ? 'person-circle-outline' : 'person-outline'} size={16} color={theme.countText} />
            <Text style={[styles.infoText, { color: theme.countText }]}>
              {user
                ? <> Connecté en tant que <Text style={styles.infoEmail}>{user.email}</Text></>
                : ' Mode invité — vos informations seront demandées'}
            </Text>
          </View>
        </View>
      )}

      {alreadyInQueue && myEntry ? (
        <TouchableOpacity style={[styles.trackingBtn, { backgroundColor: theme.success }]}
          onPress={() => navigation.replace('Tracking', { entry: myEntry, queue: initialQueue })}>
          <Ionicons name="timer-outline" size={20} color="#fff" />
          <Text style={styles.trackingBtnText}> Voir mon suivi</Text>
        </TouchableOpacity>
      ) : !showGuestForm ? (
        <TouchableOpacity
          style={[styles.joinBtn, { backgroundColor: theme.header }, loading && styles.joinBtnDisabled]}
          onPress={() => user ? handleJoin(null, null) : setShowGuestForm(true)}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <>
              <Ionicons name={user ? 'checkmark-circle-outline' : 'person-add-outline'} size={20} color="#fff" />
              <Text style={styles.joinBtnText}> {user ? 'Rejoindre la file' : 'Rejoindre en invité'}</Text>
            </>
          )}
        </TouchableOpacity>
      ) : (
        <GuestForm onSubmit={handleJoin} loading={loading} />
      )}

      {!user && !showGuestForm && !alreadyInQueue && (
        <TouchableOpacity style={styles.loginHint} onPress={() => navigation.navigate('Login')}>
          <Text style={[styles.loginHintText, { color: theme.subtext }]}>
            Déjà un compte ?{' '}
            <Text style={[styles.loginHintLink, { color: theme.countText }]}>Se connecter</Text>
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  backText: { fontSize: 14 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 8 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80', marginRight: 6 },
  liveText: { fontSize: 12, fontWeight: '600' },
  card: { margin: 16, borderRadius: 16, padding: 20, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  statRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: 12, textAlign: 'center' },
  divider: { width: 1, height: 40 },
  alreadyBox: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, borderRadius: 12, padding: 14, marginBottom: 4 },
  alreadyText: { fontSize: 14, flex: 1 },
  infoBox: { marginHorizontal: 16, borderRadius: 12, padding: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoText: { fontSize: 14, flex: 1 },
  infoEmail: { fontWeight: '700' },
  trackingBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: 16, borderRadius: 16, padding: 18 },
  trackingBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  joinBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: 16, borderRadius: 16, padding: 18 },
  joinBtnDisabled: { opacity: 0.6 },
  joinBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  loginHint: { alignItems: 'center', marginBottom: 24 },
  loginHintText: { fontSize: 13 },
  loginHintLink: { fontWeight: '600' },
})