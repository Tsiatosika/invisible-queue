import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Modal, Animated
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../../lib/supabase'
import { useNotifications } from '../hooks/useNotifications'

export default function TrackingScreen({ route, navigation }) {
  const { entry: initialEntry, queue } = route.params
  const { theme } = useTheme()
  const [entry, setEntry] = useState(initialEntry)
  const [totalWaiting, setTotalWaiting] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [notification, setNotification] = useState(null)
  const notifAnim = useRef(new Animated.Value(0)).current
  const channelRef = useRef(null)

  const showNotification = (notif) => {
    setNotification(notif)
    Animated.sequence([
      Animated.timing(notifAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(4000),
      Animated.timing(notifAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setNotification(null))
  }

  useNotifications(initialEntry.id, queue.id, showNotification)

  useEffect(() => {
    fetchEntry()
    if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null }
    const channel = supabase.channel('tracking_' + Date.now())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_entries' }, () => fetchEntry())
      .subscribe()
    channelRef.current = channel
    return () => { if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null } }
  }, [])

  const fetchEntry = async () => {
    const { data: currentEntry, error } = await supabase.from('queue_entries').select('*')
      .eq('id', initialEntry.id).maybeSingle()
    if (error || !currentEntry) return
    setEntry(currentEntry)
    const { count } = await supabase.from('queue_entries').select('*', { count: 'exact', head: true })
      .eq('queue_id', queue.id).eq('status', 'waiting').lt('position', currentEntry.position)
    setTotalWaiting(count ?? 0)
  }

  const handleLeaveConfirmed = async () => {
    setShowConfirm(false)
    setLoading(true)
    try {
      const { error } = await supabase.from('queue_entries').delete().eq('id', initialEntry.id)
      if (error) throw error
      if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null }
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] })
    } catch { setLoading(false) }
  }

  const isNext = totalWaiting === 0
  const missedTurns = entry?.missed_turns ?? 0

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>

      {notification && (
        <Animated.View style={[
          styles.notifBanner,
          { backgroundColor: notification.type === 'next' ? theme.success : theme.warning },
          { opacity: notifAnim, transform: [{ translateY: notifAnim.interpolate({ inputRange: [0, 1], outputRange: [-60, 0] }) }] }
        ]}>
          <Ionicons name={notification.type === 'next' ? 'notifications' : 'alarm-outline'} size={18} color="#fff" />
          <Text style={styles.notifText}> {notification.message}</Text>
        </Animated.View>
      )}

      <Modal visible={showConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.card }]}>
            <Ionicons name="exit-outline" size={48} color={theme.danger} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>Quitter la file ?</Text>
            <Text style={[styles.modalText, { color: theme.subtext }]}>
              Votre place sera libérée et vous perdrez votre position.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalCancel, { borderColor: theme.border }]} onPress={() => setShowConfirm(false)}>
                <Text style={[styles.modalCancelText, { color: theme.subtext }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalConfirm, { backgroundColor: theme.danger }]} onPress={handleLeaveConfirmed}>
                <Text style={styles.modalConfirmText}>Quitter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={[styles.header, { backgroundColor: theme.header }]}>
        <Ionicons name="timer-outline" size={28} color={theme.headerText} style={{ marginBottom: 4 }} />
        <Text style={[styles.headerTitle, { color: theme.headerText }]}>Suivi de file</Text>
        <Text style={[styles.headerSubtitle, { color: theme.headerSub }]}>{queue.name}</Text>
      </View>

      <View style={[styles.positionCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
        <Text style={[styles.positionLabel, { color: theme.subtext }]}>Votre position</Text>
        <Text style={[styles.positionValue, { color: theme.countText }]}>#{entry?.position ?? '—'}</Text>
        {isNext ? (
          <View style={[styles.nextBadge, { backgroundColor: '#dcfce7' }]}>
            <Ionicons name="checkmark-circle" size={16} color={theme.success} />
            <Text style={[styles.nextText, { color: theme.success }]}> C'est votre tour !</Text>
          </View>
        ) : (
          <View style={styles.waitingRow}>
            <Ionicons name="people-outline" size={16} color={theme.subtext} />
            <Text style={[styles.waitingText, { color: theme.subtext }]}>
              {' '}{totalWaiting} personne{totalWaiting > 1 ? 's' : ''} devant vous
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.infoCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
        {[
          { icon: 'time-outline', label: 'Temps estimé', value: `~${(totalWaiting + 1) * 5} min`, color: theme.countText },
          { icon: 'warning-outline', label: 'Tours manqués', value: `${missedTurns} / 3`, color: missedTurns > 0 ? theme.danger : theme.countText },
          { icon: 'pulse-outline', label: 'Statut', value: 'En attente', color: theme.countText },
        ].map(({ icon, label, value, color }) => (
          <View key={label} style={[styles.infoRow, { borderBottomColor: theme.separator }]}>
            <View style={styles.infoLeft}>
              <Ionicons name={icon} size={18} color={color} />
              <Text style={[styles.infoLabel, { color: theme.subtext }]}> {label}</Text>
            </View>
            <Text style={[styles.infoValue, { color, }]}>{value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.liveIndicator}>
        <View style={[styles.liveDot, { backgroundColor: theme.success }]} />
        <Text style={[styles.liveText, { color: theme.success }]}>Mise à jour en temps réel</Text>
      </View>

      <TouchableOpacity
        style={[styles.leaveBtn, { borderColor: theme.danger }, loading && styles.leaveBtnDisabled]}
        onPress={() => setShowConfirm(true)}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color={theme.danger} /> : (
          <>
            <Ionicons name="exit-outline" size={20} color={theme.danger} />
            <Text style={[styles.leaveBtnText, { color: theme.danger }]}> Quitter la file</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  notifBanner: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  notifText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { borderRadius: 20, padding: 28, width: '80%', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '800', marginTop: 12, marginBottom: 8 },
  modalText: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  modalButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  modalCancel: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
  modalCancelText: { fontWeight: '600' },
  modalConfirm: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
  modalConfirmText: { color: '#fff', fontWeight: '700' },
  header: { padding: 20, paddingTop: 40, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 14, marginTop: 4 },
  positionCard: { margin: 16, borderRadius: 20, padding: 32, alignItems: 'center', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  positionLabel: { fontSize: 14, marginBottom: 8 },
  positionValue: { fontSize: 72, fontWeight: '900' },
  nextBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginTop: 12 },
  nextText: { fontWeight: '700', fontSize: 14 },
  waitingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  waitingText: { fontSize: 15 },
  infoCard: { marginHorizontal: 16, borderRadius: 16, padding: 20, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  infoLeft: { flexDirection: 'row', alignItems: 'center' },
  infoLabel: { fontSize: 14 },
  infoValue: { fontSize: 14, fontWeight: '700' },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  liveDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  liveText: { fontSize: 13, fontWeight: '600' },
  leaveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: 16, marginTop: 24, borderWidth: 2, borderRadius: 16, padding: 16 },
  leaveBtnDisabled: { opacity: 0.5 },
  leaveBtnText: { fontSize: 16, fontWeight: '700' },
})