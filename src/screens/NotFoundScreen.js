import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

export default function NotFoundScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="search-outline" size={48} color="#4f46e5" />
      </View>
      <Text style={styles.title}>Page introuvable</Text>
      <Text style={styles.text}>Cette page n'existe pas ou a été supprimée.</Text>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
      >
        <View style={styles.btnContent}>
          <Ionicons name="arrow-back" size={16} color="#fff" style={styles.btnIcon} />
          <Text style={styles.btnText}>Retour à l'accueil</Text>
        </View>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center',
    alignItems: 'center', backgroundColor: '#f8f9fa', padding: 32,
  },
  iconContainer: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: '#ede9fe',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#1a1a2e', marginBottom: 8 },
  text: { fontSize: 15, color: '#999', textAlign: 'center', marginBottom: 32 },
  btn: {
    backgroundColor: '#4f46e5', borderRadius: 14,
    paddingHorizontal: 24, paddingVertical: 14,
  },
  btnContent: { flexDirection: 'row', alignItems: 'center' },
  btnIcon: { marginRight: 8 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
})