import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

export default function QueueCard({ queue, onPress, onManage, distance }) {
  const count = queue.queue_entries?.[0]?.count ?? 0
  const waitMinutes = count * 5

  const distanceText = distance < 1000
    ? `${Math.round(distance)} m`
    : `${(distance / 1000).toFixed(1)} km`

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={onPress}>
        <View style={styles.header}>
          <Text style={styles.name}>{queue.name}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{distanceText}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.info}>
            <Text style={styles.infoLabel}>👥 Personnes en attente</Text>
            <Text style={styles.infoValue}>{count}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.infoLabel}>⏱️ Temps estimé</Text>
            <Text style={styles.infoValue}>~{waitMinutes} min</Text>
          </View>
        </View>
      </TouchableOpacity>

      {onManage && (
        <TouchableOpacity style={styles.manageBtn} onPress={onManage}>
          <Text style={styles.manageBtnText}>⚙️ Gérer la file</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16, padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8, elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', flex: 1 },
  badge: {
    backgroundColor: '#ede9fe',
    borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  badgeText: { color: '#4f46e5', fontWeight: '600', fontSize: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-between' },
  info: { alignItems: 'center' },
  infoLabel: { fontSize: 12, color: '#999', marginBottom: 2 },
  infoValue: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  manageBtn: {
    marginTop: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  manageBtnText: { color: '#4f46e5', fontWeight: '600', fontSize: 13 },
})