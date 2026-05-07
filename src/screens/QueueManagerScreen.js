import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, ActivityIndicator, Modal
} from 'react-native'
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
        event: '*',
        schema: 'public',
        table: 'queue_entries',
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
    try {
      await supabase
        .from('queue_entries')
        .update({ status: 'served' })
        .eq('id', entry.id)
      await fetchEntries()
    } catch (err) {}
    setActionLoading(false)
    setShowModal(false)
  }

  const handleMissTurn = async (entry) => {
    setActionLoading(true)
    try {
      const newMissed = (entry.missed_turns || 0) + 1

      if (newMissed >= 3) {
        await supabase
          .from('queue_entries')
          .update({ status: 'excluded', missed_turns: newMissed })
          .eq('id', entry.id)
      } else {
        await supabase
          .from('queue_entries')
          .update({
            missed_turns: newMissed,
            position: entry.position + 3
          })
          .eq('id', entry.id)
      }
      await fetchEntries()
    } catch (err) {}
    setActionLoading(false)
    setShowModal(false)
  }

  const handleRemove = async (entry) => {
    setActionLoading(true)
    try {
      await supabase
        .from('queue_entries')
        .delete()
        .eq('id', entry.id)
      await fetchEntries()
    } catch (err) {}
    setActionLoading(false)
    setShowModal(false)
  }

  const openModal = (entry) => {
    setSelectedEntry(entry)
    setShowModal(true)
  }

  const renderEntry = ({ item, index }) => (
    <TouchableOpacity style={styles.entryCard} onPress={() => openModal(item)}>
      <View style={styles.entryLeft}>
        <View style={styles.positionBadge}>
          <Text style={styles.positionText}>#{item.position}</Text>
        </View>
        <View>
          <Text style={styles.entryName}>
            {item.guest_name || item.user_id?.substring(0, 8) + '...' || 'Utilisateur'}
          </Text>
          <Text style={styles.entryEmail}>
            {item.guest_email || 'Compte connecté'}
          </Text>
          {item.missed_turns > 0 && (
            <Text style={styles.missedText}>
              ⚠️ {item.missed_turns} tour{item.missed_turns > 1 ? 's' : ''} manqué{item.missed_turns > 1 ? 's' : ''}
            </Text>
          )}
        </View>
      </View>
      <Text style={styles.actionHint}>Appuyer pour gérer</Text>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>

      {/* Modal d'actions */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              Gérer — Position #{selectedEntry?.position}
            </Text>
            <Text style={styles.modalName}>
              {selectedEntry?.guest_name || 'Utilisateur connecté'}
            </Text>
            {selectedEntry?.guest_email && (
              <Text style={styles.modalEmail}>{selectedEntry.guest_email}</Text>
            )}

            <View style={styles.modalActions}>
              {/* Servi */}
              <TouchableOpacity
                style={styles.btnServed}
                onPress={() => handleServe(selectedEntry)}
                disabled={actionLoading}
              >
                {actionLoading ? <ActivityIndicator color="#fff" /> :
                  <Text style={styles.btnText}>✅ Marquer comme servi</Text>}
              </TouchableOpacity>

              {/* Tour manqué */}
              <TouchableOpacity
                style={styles.btnMissed}
                onPress={() => handleMissTurn(selectedEntry)}
                disabled={actionLoading}
              >
                <Text style={styles.btnText}>
                  ⚠️ Tour manqué ({(selectedEntry?.missed_turns || 0) + 1}/3)
                </Text>
              </TouchableOpacity>

              {/* Retirer */}
              <TouchableOpacity
                style={styles.btnRemove}
                onPress={() => handleRemove(selectedEntry)}
                disabled={actionLoading}
              >
                <Text style={styles.btnText}>🗑️ Retirer de la file</Text>
              </TouchableOpacity>

              {/* Annuler */}
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
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{queue.name}</Text>
        <Text style={styles.headerSubtitle}>
          {entries.length} personne{entries.length !== 1 ? 's' : ''} en attente
        </Text>
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
              <Text style={styles.emptyIcon}>🎉</Text>
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
  header: {
    backgroundColor: '#4f46e5',
    padding: 20, paddingTop: 40,
  },
  backBtn: { marginBottom: 8 },
  backText: { color: '#c7d2fe', fontSize: 14 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 13, color: '#c7d2fe', marginTop: 4 },
  list: { padding: 16 },
  entryCard: {
    backgroundColor: '#fff',
    borderRadius: 14, padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4, elevation: 2,
  },
  entryLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  positionBadge: {
    backgroundColor: '#ede9fe',
    width: 44, height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  positionText: { color: '#4f46e5', fontWeight: '800', fontSize: 15 },
  entryName: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  entryEmail: { fontSize: 12, color: '#999', marginTop: 2 },
  missedText: { fontSize: 12, color: '#f59e0b', marginTop: 2 },
  actionHint: { fontSize: 11, color: '#c7d2fe' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  emptyText: { fontSize: 14, color: '#999', marginTop: 4 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 16, fontWeight: '700',
    color: '#1a1a2e', marginBottom: 4,
  },
  modalName: { fontSize: 18, fontWeight: '800', color: '#4f46e5' },
  modalEmail: { fontSize: 13, color: '#999', marginBottom: 20 },
  modalActions: { gap: 10, marginTop: 16 },
  btnServed: {
    backgroundColor: '#22c55e',
    borderRadius: 12, padding: 16, alignItems: 'center',
  },
  btnMissed: {
    backgroundColor: '#f59e0b',
    borderRadius: 12, padding: 16, alignItems: 'center',
  },
  btnRemove: {
    backgroundColor: '#ef4444',
    borderRadius: 12, padding: 16, alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnCancel: {
    borderWidth: 1, borderColor: '#ddd',
    borderRadius: 12, padding: 16, alignItems: 'center',
  },
  btnCancelText: { color: '#666', fontWeight: '600', fontSize: 15 },
})