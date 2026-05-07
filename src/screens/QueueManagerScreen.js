import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, ActivityIndicator, Modal
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'

export default function QueueManagerScreen({ route, navigation }) {
  const { queue } = route.params
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const channelRef = useRef(null)

  useEffect(() => {
    fetchEntries()

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabase
      .channel('manager_' + Date.now())
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'queue_entries',
      }, () => fetchEntries())
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [])

  const fetchEntries = async () => {
    const { data, error } = await supabase
      .from('queue_entries')
      .select('*')
      .eq('queue_id', queue.id)
      .eq('status', 'waiting')
      .order('position', { ascending: true })

    if (!error) setEntries(data || [])
    setLoading(false)
  }

  const handleServe = async (entry) => {
    setActionLoading(true)
    await supabase.from('queue_entries').update({ status: 'served' }).eq('id', entry.id)
    await fetchEntries()
    setActionLoading(false)
    setShowModal(false)
  }

  const handleMissTurn = async (entry) => {
    setActionLoading(true)
    const newMissed = (entry.missed_turns || 0) + 1
    if (newMissed >= 3) {
      await supabase.from('queue_entries')
        .update({ status: 'excluded', missed_turns: newMissed })
        .eq('id', entry.id)
    } else {
      await supabase.from('queue_entries')
        .update({ missed_turns: newMissed, position: entry.position + 3 })
        .eq('id', entry.id)
    }
    await fetchEntries()
    setActionLoading(false)
    setShowModal(false)
  }

  const handleRemove = async (entry) => {
    setActionLoading(true)
    await supabase.from('queue_entries').delete().eq('id', entry.id)
    await fetchEntries()
    setActionLoading(false)
    setShowModal(false)
  }

  const renderEntry = ({ item }) => (
    <TouchableOpacity style={styles.entryCard} onPress={() => { setSelectedEntry(item); setShowModal(true) }}>
      <View style={styles.entryLeft}>
        <View style={styles.positionBadge}>
          <Text style={styles.positionText}>#{item.position}</Text>
        </View>
        <View>
          <Text style={styles.entryName}>
            {item.guest_name || 'Utilisateur connecté'}
          </Text>
          <Text style={styles.entryEmail}>
            {item.guest_email || 'Compte authentifié'}
          </Text>
          {item.missed_turns > 0 && (
            <View style={styles.missedRow}>
              <Ionicons name="warning-outline" size={12} color="#f59e0b" />
              <Text style={styles.missedText}>
                {' '}{item.missed_turns} tour{item.missed_turns > 1 ? 's' : ''} manqué{item.missed_turns > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward-outline" size={20} color="#c7d2fe" />
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>

      {/* Modal actions */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Position #{selectedEntry?.position}</Text>
            <Text style={styles.modalName}>
              {selectedEntry?.guest_name || 'Utilisateur connecté'}
            </Text>
            {selectedEntry?.guest_email && (
              <Text style={styles.modalEmail}>{selectedEntry.guest_email}</Text>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.btnServed}
                onPress={() => handleServe(selectedEntry)}
                disabled={actionLoading}
              >
                {actionLoading ? <ActivityIndicator color="#fff" /> : (
                  <View style={styles.btnInner}>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                    <Text style={styles.btnText}> Marquer comme servi</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnMissed}
                onPress={() => handleMissTurn(selectedEntry)}
                disabled={actionLoading}
              >
                <View style={styles.btnInner}>
                  <Ionicons name="alert-circle-outline" size={20} color="#fff" />
                  <Text style={styles.btnText}>
                    {' '}Tour manqué ({(selectedEntry?.missed_turns || 0) + 1}/3)
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnRemove}
                onPress={() => handleRemove(selectedEntry)}
                disabled={actionLoading}
              >
                <View style={styles.btnInner}>
                  <Ionicons name="trash-outline" size={20} color="#fff" />
                  <Text style={styles.btnText}> Retirer de la file</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.btnCancelText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back-outline" size={20} color="#c7d2fe" />
          <Text style={styles.backText}> Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{queue.name}</Text>
        <View style={styles.countRow}>
          <Ionicons name="people-outline" size={14} color="#c7d2fe" />
          <Text style={styles.headerSubtitle}>
            {' '}{entries.length} personne{entries.length !== 1 ? 's' : ''} en attente
          </Text>
        </View>
      </View>

      {/* Liste */}
      {loading ? (
        <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={renderEntry}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="checkmark-done-circle-outline" size={64} color="#22c55e" />
              <Text style={styles.emptyTitle}>File vide !</Text>
              <Text style={styles.emptyText}>Tout le monde a été servi.</Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { backgroundColor: '#4f46e5', padding: 20, paddingTop: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  backText: { color: '#c7d2fe', fontSize: 14 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  countRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  headerSubtitle: { fontSize: 13, color: '#c7d2fe' },
  list: { padding: 16 },
  entryCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    marginBottom: 10, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  entryLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  positionBadge: {
    backgroundColor: '#ede9fe', width: 44, height: 44,
    borderRadius: 22, justifyContent: 'center', alignItems: 'center',
  },
  positionText: { color: '#4f46e5', fontWeight: '800', fontSize: 15 },
  entryName: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  entryEmail: { fontSize: 12, color: '#999', marginTop: 2 },
  missedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  missedText: { fontSize: 12, color: '#f59e0b' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginTop: 12 },
  emptyText: { fontSize: 14, color: '#999', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: '#fff', borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: 24, paddingBottom: 40,
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: '#e5e7eb',
    borderRadius: 2, alignSelf: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 14, color: '#999', marginBottom: 4 },
  modalName: { fontSize: 20, fontWeight: '800', color: '#4f46e5' },
  modalEmail: { fontSize: 13, color: '#999', marginBottom: 8 },
  modalActions: { gap: 10, marginTop: 16 },
  btnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  btnServed: { backgroundColor: '#22c55e', borderRadius: 12, padding: 16, alignItems: 'center' },
  btnMissed: { backgroundColor: '#f59e0b', borderRadius: 12, padding: 16, alignItems: 'center' },
  btnRemove: { backgroundColor: '#ef4444', borderRadius: 12, padding: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnCancel: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 16, alignItems: 'center' },
  btnCancelText: { color: '#666', fontWeight: '600', fontSize: 15 },
})