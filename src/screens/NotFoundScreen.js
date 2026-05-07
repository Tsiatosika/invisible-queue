import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

export default function NotFoundScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔍</Text>
      <Text style={styles.title}>Page introuvable</Text>
      <Text style={styles.text}>Cette page n'existe pas ou a été supprimée.</Text>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
      >
        <Text style={styles.btnText}>← Retour à l'accueil</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center',
    alignItems: 'center', backgroundColor: '#f8f9fa', padding: 32,
  },
  icon: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#1a1a2e', marginBottom: 8 },
  text: { fontSize: 15, color: '#999', textAlign: 'center', marginBottom: 32 },
  btn: {
    backgroundColor: '#4f46e5', borderRadius: 14,
    paddingHorizontal: 24, paddingVertical: 14,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
})