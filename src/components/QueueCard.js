import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { FadeInCard, AnimatedButton } from './AnimatedCard'

export default function QueueCard({ queue, onPress, onManage, distance, theme, index = 0 }) {
  const count = queue.queue_entries?.[0]?.count ?? 0
  const waitMinutes = count * 5
  const distanceText = distance < 1000
    ? `${Math.round(distance)} m`
    : `${(distance / 1000).toFixed(1)} km`

  return (
    <FadeInCard delay={index * 100} style={[styles.card, {
      backgroundColor: theme.card,
      shadowColor: theme.shadow,
    }]}>
      <AnimatedButton onPress={onPress}>
        <View style={styles.header}>
          <Text style={[styles.name, { color: theme.text }]}>{queue.name}</Text>
          <View style={[styles.badge, { backgroundColor: theme.badge }]}>
            <Ionicons name="location-outline" size={12} color={theme.badgeText} />
            <Text style={[styles.badgeText, { color: theme.badgeText }]}> {distanceText}</Text>
          </View>
        </View>
        <View style={[styles.separator, { backgroundColor: theme.separator }]} />
        <View style={styles.footer}>
          <View style={styles.info}>
            <Ionicons name="people-outline" size={16} color={theme.subtext} />
            <Text style={[styles.infoLabel, { color: theme.subtext }]}> En attente</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}> {count}</Text>
          </View>
          <View style={[styles.verticalSep, { backgroundColor: theme.border }]} />
          <View style={styles.info}>
            <Ionicons name="time-outline" size={16} color={theme.subtext} />
            <Text style={[styles.infoLabel, { color: theme.subtext }]}> Temps</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}> ~{waitMinutes} min</Text>
          </View>
        </View>
      </AnimatedButton>

      {onManage && (
        <AnimatedButton onPress={onManage}>
          <View style={[styles.manageBtn, { backgroundColor: theme.badge }]}>
            <Ionicons name="settings-outline" size={16} color={theme.badgeText} />
            <Text style={[styles.manageBtnText, { color: theme.badgeText }]}> Gérer la file</Text>
          </View>
        </AnimatedButton>
      )}
    </FadeInCard>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16, padding: 16, marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  name: { fontSize: 17, fontWeight: '700', flex: 1 },
  badge: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  badgeText: { fontWeight: '600', fontSize: 12 },
  separator: { height: 1, marginBottom: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  verticalSep: { width: 1, height: 30 },
  info: { flexDirection: 'row', alignItems: 'center' },
  infoLabel: { fontSize: 12 },
  infoValue: { fontSize: 15, fontWeight: '700' },
  manageBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', marginTop: 12,
    borderRadius: 10, padding: 10,
  },
  manageBtnText: { fontWeight: '600', fontSize: 13 },
})
