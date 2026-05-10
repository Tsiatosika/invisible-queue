import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, ActivityIndicator, Modal
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../../lib/supabase'

export default function QueueManagerScreen({ route, navigation }) {
  const { queue } = route.params
  const { theme } = useTheme()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const channelRef = useRef(null)

  useEffect(() => {
    fetchEntries()
    if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null }
    const channel = supabase.channel('manager_' + Date.now())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_entries' }, () => fetchEntries())
      .subscribe()
    channelRef.current = channel
    return () => { if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null } }
  }, [])

  const fetchEntries = async () => {
    const { data, error } = await supabase.from('queue_entries').select('*')
      .eq('queue_id', queue.id).eq('status', 'waiting').order('position', { ascending: true })
    if (!error) setEntries(data || [])
    setLoading(false)
  }

  const handleServe = async (entry) => {
    setActionLoading(true)
    await supabase.from('queue_entries').update({ status: 'served' }).eq('id', entry.id)
    await fetchEntries(); setActionLoading(false); setShowModal(false)
  }

  const handleMissTurn = async (entry) => {
    setActionLoading(true)
    const newMissed = (entry.missed_turns || 0) + 1
    if (newMissed >= 3) {
      await supabase.from('queue_entries').update({ status: 'excluded', missed_turns: newMissed }).eq('id', entry.id)
    } else {
      await supabase.from('queue_entries').update({ missed_turns: newMissed, position: entry.position + 3 }).eq('id', entry.id)
    }
    await fetchEntries(); setActionLoading(false); setShowModal(false)
  }

  const handleRemove = async (entry) => {
    setActionLoading(true)
    await supabase.from('queue_entries').delete().eq('id', entry.id)
    await fetchEntries(); setActionLoading(false); setShowModal(false)
  }

  const renderEntry = ({ item }) => (
    <TouchableOpacity
      style={[styles.entryCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}
      onPress={() => { setSelectedEntry(item); setShowModal(true) }}
    >
      <View style={styles.entryLeft}>
        <View style={[styles.positionBadge, { backgroundColor: theme.badge }]}>
          <Text style={[styles.positionText, { color: theme.badgeText }]}>#{item.position}</Text>
        </View>
        <View>
          <Text style={[styles.entryName, { color: theme.text }]}>
            {item.guest_name || 'Utilisateur connecté'}
          </Text>
          <Text style={[styles.entryEmail, { color: theme.subtext }]}>
            {item.guest_email || 'Compte authentifié'}
          </Text>
          {item.missed_turns > 0 && (
            <View style={styles.missedRow}>
              <Ionicons name="warning-outline" size={12} color={theme.warning} />
              <Text style={[styles.missedText, { color: theme.warning }]}>
                {' '}{item.missed_turns} tour{item.missed_turns > 1 ? 's' : ''} manqué{item.missed_turns > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward-outline" size={20} color={theme.headerSub} />
    </TouchableOpacity>
  )

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.card }]}>
            <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
            <Text style={[styles.modalTitle, { color: theme.subtext }]}>Position #{selectedEntry?.position}</Text>
            <Text style={[styles.modalName, { color: theme.countText }]}>
              {selectedEntry?.guest_name || 'Utilisateur connecté'}
            </Text>
            {selectedEntry?.guest_email && (
              <Text style={[styles.modalEmail, { color: theme.subtext }]}>{selectedEntry.guest_email}</Text>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.btn, { backgroundColor: theme.success }]}
                onPress={() => handleServe(selectedEntry)} disabled={actionLoading}>
                {actionLoading ? <ActivityIndicator color="#fff" /> : (
                  <View style={styles.btnInner}>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                    <Text style={styles.btnText}> Marquer comme servi</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { backgroundColor: theme.warning }]}
                onPress={() => handleMissTurn(selectedEntry)} disabled={actionLoading}>
                <View style={styles.btnInner}>
                  <Ionicons name="alert-circle-outline" size={20} color="#fff" />
                  <Text style={styles.btnText}> Tour manqué ({(selectedEntry?.missed_turns || 0) + 1}/3)</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { backgroundColor: theme.danger }]}
                onPress={() => handleRemove(selectedEntry)} disabled={actionLoading}>
                <View style={styles.btnInner}>
                  <Ionicons name="trash-outline" size={20} color="#fff" />
                  <Text style={styles.btnText}> Retirer de la file</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnCancel, { borderColor: theme.border }]}
                onPress={() => setShowModal(false)}>
                <Text style={[styles.btnCancelText, { color: theme.subtext }]}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={[styles.header, { backgroundColor: theme.header }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back-outline" size={20} color={theme.headerSub} />
          <Text style={[styles.backText, { color: theme.headerSub }]}> Retour</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.headerText }]}>{queue.name}</Text>
        <View style={styles.countRow}>
          <Ionicons name="people-outline" size={14} color={theme.headerSub} />
          <Text style={[styles.headerSubtitle, { color: theme.headerSub }]}>
            {' '}{entries.length} personne{entries.length !== 1 ? 's' : ''} en attente
          </Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.countText} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={renderEntry}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="checkmark-done-circle-outline" size={64} color={theme.success} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>File vide !</Text>
              <Text style={[styles.emptyText, { color: theme.subtext }]}>Tout le monde a été servi.</Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  backText: { fontSize: 14 },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  countRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  headerSubtitle: { fontSize: 13 },
  list: { padding: 16 },
  entryCard: { borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  entryLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  positionBadge: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  positionText: { fontWeight: '800', fontSize: 15 },
  entryName: { fontSize: 15, fontWeight: '700' },
  entryEmail: { fontSize: 12, marginTop: 2 },
  missedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  missedText: { fontSize: 12 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 12 },
  emptyText: { fontSize: 14, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 14, marginBottom: 4 },
  modalName: { fontSize: 20, fontWeight: '800' },
  modalEmail: { fontSize: 13, marginBottom: 8 },
  modalActions: { gap: 10, marginTop: 16 },
  btn: { borderRadius: 12, padding: 16, alignItems: 'center' },
  btnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnCancel: { borderWidth: 1, borderRadius: 12, padding: 16, alignItems: 'center' },
  btnCancelText: { fontWeight: '600', fontSize: 15 },
})