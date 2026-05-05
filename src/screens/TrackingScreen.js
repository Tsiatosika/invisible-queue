import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Modal
} from 'react-native'
import { supabase } from '../../lib/supabase'

export default function TrackingScreen({ route, navigation }) {
  const { entry: initialEntry, queue } = route.params
  const [entry, setEntry] = useState(initialEntry)
  const [totalWaiting, setTotalWaiting] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const channelRef = useRef(null)

  useEffect(() => {
    fetchEntry()

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabase
      .channel('tracking_' + Date.now())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'queue_entries',
      }, () => {
        fetchEntry()
      })
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

      navigation.reset({ index: 0, routes: [{ name: 'Home' }] })
    } catch (err) {
      setLoading(false)
    }
  }

  const isNext = totalWaiting === 0
  const missedTurns = entry?.missed_turns ?? 0

  return (
    <View style={styles.container}>

      {/* Modal de confirmation personnalisé */}
      <Modal
        visible={showConfirm}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalIcon}>🚪</Text>
            <Text style={styles.modalTitle}>Quitter la file ?</Text>
            <Text style={styles.modalText}>
              Votre place sera libérée et vous perdrez votre position.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowConfirm(false)}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirm}
                onPress={handleLeaveConfirmed}
              >
                <Text style={styles.modalConfirmText}>Quitter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Suivi de file</Text>
        <Text style={styles.headerSubtitle}>{queue.name}</Text>
      </View>

      {/* Position */}
      <View style={styles.positionCard}>
        <Text style={styles.positionLabel}>Votre position</Text>
        <Text style={styles.positionValue}>#{entry?.position ?? '—'}</Text>
        {isNext ? (
          <View style={styles.nextBadge}>
            <Text style={styles.nextText}>🔔 C'est bientôt votre tour !</Text>
          </View>
        ) : (
          <Text style={styles.waitingText}>
            {totalWaiting} personne{totalWaiting > 1 ? 's' : ''} devant vous
          </Text>
        )}
      </View>

      {/* Infos */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>⏱️ Temps estimé</Text>
          <Text style={styles.infoValue}>~{(totalWaiting + 1) * 5} min</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>⚠️ Tours manqués</Text>
          <Text style={[styles.infoValue, missedTurns > 0 && { color: '#ef4444' }]}>
            {missedTurns} / 3
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>📊 Statut</Text>
          <Text style={styles.infoValue}>⏳ En attente</Text>
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
          <Text style={styles.leaveBtnText}>🚪 Quitter la file</Text>
        )}
      </TouchableOpacity>

    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalIcon: { fontSize: 40, marginBottom: 12 },
  modalTitle: {
    fontSize: 20, fontWeight: '800',
    color: '#1a1a2e', marginBottom: 8,
  },
  modalText: {
    fontSize: 14, color: '#666',
    textAlign: 'center', lineHeight: 20, marginBottom: 24,
  },
  modalButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  modalCancel: {
    flex: 1, borderWidth: 1, borderColor: '#ddd',
    borderRadius: 12, padding: 14, alignItems: 'center',
  },
  modalCancelText: { color: '#666', fontWeight: '600', fontSize: 15 },
  modalConfirm: {
    flex: 1, backgroundColor: '#ef4444',
    borderRadius: 12, padding: 14, alignItems: 'center',
  },
  modalConfirmText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Header
  header: {
    backgroundColor: '#4f46e5', padding: 20,
    paddingTop: 40, alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#c7d2fe', marginTop: 4 },

  // Position card
  positionCard: {
    backgroundColor: '#fff', margin: 16, borderRadius: 20,
    padding: 32, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  positionLabel: { fontSize: 14, color: '#999', marginBottom: 8 },
  positionValue: { fontSize: 72, fontWeight: '900', color: '#4f46e5' },
  nextBadge: {
    backgroundColor: '#dcfce7', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8, marginTop: 12,
  },
  nextText: { color: '#16a34a', fontWeight: '700', fontSize: 14 },
  waitingText: { color: '#666', fontSize: 16, marginTop: 12 },

  // Info card
  infoCard: {
    backgroundColor: '#fff', marginHorizontal: 16,
    borderRadius: 16, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  infoLabel: { fontSize: 14, color: '#666' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },

  // Live
  liveIndicator: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', marginTop: 16,
  },
  liveDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#22c55e', marginRight: 6,
  },
  liveText: { color: '#22c55e', fontSize: 13, fontWeight: '600' },

  // Leave button
  leaveBtn: {
    margin: 16, marginTop: 24, borderWidth: 2,
    borderColor: '#ef4444', borderRadius: 16,
    padding: 16, alignItems: 'center',
  },
  leaveBtnDisabled: { opacity: 0.5 },
  leaveBtnText: { color: '#ef4444', fontSize: 16, fontWeight: '700' },
})