import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Modal, Animated, ScrollView
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { useNotifications } from '../hooks/useNotifications'
import { useTheme } from '../context/ThemeContext'

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

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabase
      .channel('tracking_' + Date.now())
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'queue_entries',
      }, () => fetchEntry())
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [])

  const fetchEntry = async () => {
    const { data: currentEntry, error } = await supabase
      .from('queue_entries')
      .select('*')
      .eq('id', initialEntry.id)
      .maybeSingle()

    if (error || !currentEntry) return
    setEntry(currentEntry)

    const { count } = await supabase
      .from('queue_entries')
      .select('*', { count: 'exact', head: true })
      .eq('queue_id', queue.id)
      .eq('status', 'waiting')
      .lt('position', currentEntry.position)

    setTotalWaiting(count ?? 0)
  }

  const handleLeaveConfirmed = async () => {
    setShowConfirm(false)
    setLoading(true)
    try {
      const { error } = await supabase
        .from('queue_entries')
        .delete()
        .eq('id', initialEntry.id)

      if (error) throw error

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }

      navigation.reset({ index: 0, routes: [{ name: 'Main' }] })
    } catch (err) {
      setLoading(false)
    }
  }

  const isNext = totalWaiting === 0
  const missedTurns = entry?.missed_turns ?? 0

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>

      {/* Notification banner */}
      {notification && (
        <Animated.View style={[
          styles.notifBanner,
          notification.type === 'next' ? styles.notifNext : styles.notifNear,
          { opacity: notifAnim, transform: [{ translateY: notifAnim.interpolate({
            inputRange: [0, 1], outputRange: [-60, 0]
          })}]}
        ]}>
          <Ionicons
            name={notification.type === 'next' ? 'notifications' : 'alarm-outline'}
            size={18} color="#fff"
          />
          <Text style={styles.notifText}> {notification.message}</Text>
        </Animated.View>
      )}

      {/* Modal confirmation */}
      <Modal visible={showConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.card }]}>
            <Ionicons name="exit-outline" size={48} color="#ef4444" />
            <Text style={[styles.modalTitle, { color: theme.text }]}>Quitter la file ?</Text>
            <Text style={[styles.modalText, { color: theme.subtext }]}>
              Votre place sera libérée et vous perdrez votre position.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalCancel, { borderColor: theme.border }]}
                onPress={() => setShowConfirm(false)}
              >
                <Text style={[styles.modalCancelText, { color: theme.subtext }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleLeaveConfirmed}>
                <Text style={styles.modalConfirmText}>Quitter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Header avec bouton retour */}
      <View style={[styles.header, { backgroundColor: theme.header }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back-outline" size={20} color={theme.headerSub} />
          <Text style={[styles.backText, { color: theme.headerSub }]}> Retour</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="timer-outline" size={24} color={theme.headerText} style={{ marginBottom: 4 }} />
          <Text style={[styles.headerTitle, { color: theme.headerText }]}>Suivi de file</Text>
          <Text style={[styles.headerSubtitle, { color: theme.headerSub }]}>{queue.name}</Text>
        </View>
        {/* Espace pour équilibrer le header */}
        <View style={styles.headerRight} />
      </View>

      {/* Contenu scrollable */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Position */}
        <View style={[styles.positionCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
          <Text style={[styles.positionLabel, { color: theme.subtext }]}>Votre position</Text>
          <Text style={[styles.positionValue, { color: '#4f46e5' }]}>#{entry?.position ?? '—'}</Text>
          {isNext ? (
            <View style={styles.nextBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
              <Text style={styles.nextText}> C'est votre tour !</Text>
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

        {/* Infos */}
        <View style={[styles.infoCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
          <View style={[styles.infoRow, { borderBottomColor: theme.separator }]}>
            <View style={styles.infoLeft}>
              <Ionicons name="time-outline" size={18} color="#4f46e5" />
              <Text style={[styles.infoLabel, { color: theme.subtext }]}> Temps estimé</Text>
            </View>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              ~{(totalWaiting + 1) * 5} min
            </Text>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: theme.separator }]}>
            <View style={styles.infoLeft}>
              <Ionicons name="warning-outline" size={18} color={missedTurns > 0 ? '#ef4444' : '#4f46e5'} />
              <Text style={[styles.infoLabel, { color: theme.subtext }]}> Tours manqués</Text>
            </View>
            <Text style={[styles.infoValue, missedTurns > 0 && { color: '#ef4444' }, { color: theme.text }]}>
              {missedTurns} / 3
            </Text>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: 'transparent' }]}>
            <View style={styles.infoLeft}>
              <Ionicons name="pulse-outline" size={18} color="#4f46e5" />
              <Text style={[styles.infoLabel, { color: theme.subtext }]}> Statut</Text>
            </View>
            <Text style={[styles.infoValue, { color: theme.text }]}>En attente</Text>
          </View>
        </View>

        {/* Live indicator */}
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Mise à jour en temps réel</Text>
        </View>

        {/* Bouton quitter */}
        <TouchableOpacity
          style={[styles.leaveBtn, loading && styles.leaveBtnDisabled]}
          onPress={() => setShowConfirm(true)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ef4444" />
          ) : (
            <>
              <Ionicons name="exit-outline" size={20} color="#ef4444" />
              <Text style={styles.leaveBtnText}> Quitter la file</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Info recul */}
        <View style={[styles.warningBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="information-circle-outline" size={18} color={theme.subtext} />
          <Text style={[styles.warningText, { color: theme.subtext }]}>
            {' '}Si vous manquez votre tour, vous reculez de 3 positions. Au bout de 3 tours manqués, vous serez exclu de la file.
          </Text>
        </View>

      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Notification
  notifBanner: {
    position: 'absolute', top: 0, left: 0, right: 0,
    zIndex: 100, padding: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  notifNear: { backgroundColor: '#f59e0b' },
  notifNext: { backgroundColor: '#22c55e' },
  notifText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalBox: {
    borderRadius: 20, padding: 28,
    width: '80%', alignItems: 'center',
  },
  modalTitle: { fontSize: 20, fontWeight: '800', marginTop: 12, marginBottom: 8 },
  modalText: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  modalButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  modalCancel: {
    flex: 1, borderWidth: 1,
    borderRadius: 12, padding: 14, alignItems: 'center',
  },
  modalCancelText: { fontWeight: '600' },
  modalConfirm: {
    flex: 1, backgroundColor: '#ef4444',
    borderRadius: 12, padding: 14, alignItems: 'center',
  },
  modalConfirmText: { color: '#fff', fontWeight: '700' },

  // Header
  header: {
    paddingTop: 40, paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    flexDirection: 'row', alignItems: 'center',
    width: 80,
  },
  backText: { fontSize: 14 },
  headerCenter: { alignItems: 'center', flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  headerRight: { width: 80 },

  // Scroll
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // Position card
  positionCard: {
    borderRadius: 20, padding: 32,
    alignItems: 'center', marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  positionLabel: { fontSize: 14, marginBottom: 8 },
  positionValue: { fontSize: 72, fontWeight: '900' },
  nextBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#dcfce7', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8, marginTop: 12,
  },
  nextText: { color: '#16a34a', fontWeight: '700', fontSize: 14 },
  waitingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  waitingText: { fontSize: 15 },

  // Info card
  infoCard: {
    borderRadius: 16, padding: 20, marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1,
  },
  infoLeft: { flexDirection: 'row', alignItems: 'center' },
  infoLabel: { fontSize: 14 },
  infoValue: { fontSize: 14, fontWeight: '700' },

  // Live
  liveIndicator: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', marginBottom: 16,
  },
  liveDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#22c55e', marginRight: 6,
  },
  liveText: { color: '#22c55e', fontSize: 13, fontWeight: '600' },

  // Leave button
  leaveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#ef4444',
    borderRadius: 16, padding: 16, marginBottom: 16,
  },
  leaveBtnDisabled: { opacity: 0.5 },
  leaveBtnText: { color: '#ef4444', fontSize: 16, fontWeight: '700' },

  // Warning box
  warningBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    borderWidth: 1, borderRadius: 12,
    padding: 14,
  },
  warningText: { fontSize: 13, flex: 1, lineHeight: 18 },
})
