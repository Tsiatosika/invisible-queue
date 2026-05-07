import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, ScrollView
} from 'react-native'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../../lib/supabase'

export default function CreateQueueScreen({ navigation }) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [latitude, setLatitude] = useState('-18.9137')
  const [longitude, setLongitude] = useState('47.5361')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Le nom de la file est obligatoire')
      return
    }
    if (!latitude || !longitude) {
      setError('Les coordonnées sont obligatoires')
      return
    }

    setError('')
    setLoading(true)

    try {
      const { error: err } = await supabase
        .from('queues')
        .insert({
          name: name.trim(),
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          created_by: user.id,
        })

      if (err) throw err

      navigation.reset({ index: 0, routes: [{ name: 'Home' }] })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Géolocalisation non disponible')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toString())
        setLongitude(pos.coords.longitude.toString())
      },
      () => setError('Impossible de récupérer la position')
    )
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Créer une file</Text>
        <Text style={styles.subtitle}>Réservé aux utilisateurs connectés</Text>
      </View>

      <View style={styles.form}>
        {/* Nom */}
        <Text style={styles.label}>Nom de la file *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: File Pharmacie Centrale"
          value={name}
          onChangeText={setName}
        />

        {/* Localisation */}
        <Text style={styles.label}>Localisation</Text>

        <TouchableOpacity style={styles.locationBtn} onPress={useCurrentLocation}>
          <Text style={styles.locationBtnText}>📍 Utiliser ma position actuelle</Text>
        </TouchableOpacity>

        <Text style={styles.orText}>— ou entrez manuellement —</Text>

        <Text style={styles.sublabel}>Latitude</Text>
        <TextInput
          style={styles.input}
          placeholder="-18.9137"
          value={latitude}
          onChangeText={setLatitude}
          keyboardType="numeric"
        />

        <Text style={styles.sublabel}>Longitude</Text>
        <TextInput
          style={styles.input}
          placeholder="47.5361"
          value={longitude}
          onChangeText={setLongitude}
          keyboardType="numeric"
        />

        {/* Erreur */}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        ) : null}

        {/* Bouton créer */}
        <TouchableOpacity
          style={[styles.createBtn, (!name || loading) && styles.createBtnDisabled]}
          onPress={handleCreate}
          disabled={!name || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createBtnText}>✅ Créer la file</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    backgroundColor: '#4f46e5',
    padding: 20, paddingTop: 40,
  },
  backBtn: { marginBottom: 12 },
  backText: { color: '#c7d2fe', fontSize: 14 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 13, color: '#c7d2fe', marginTop: 4 },
  form: { padding: 20 },
  label: {
    fontSize: 15, fontWeight: '700',
    color: '#1a1a2e', marginBottom: 8, marginTop: 16,
  },
  sublabel: {
    fontSize: 13, color: '#666',
    marginBottom: 6, marginTop: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#ddd',
    borderRadius: 12, padding: 14,
    fontSize: 15, marginBottom: 4,
  },
  locationBtn: {
    backgroundColor: '#ede9fe',
    borderRadius: 12, padding: 14,
    alignItems: 'center', marginBottom: 12,
  },
  locationBtnText: { color: '#4f46e5', fontWeight: '600', fontSize: 14 },
  orText: {
    textAlign: 'center', color: '#999',
    fontSize: 13, marginVertical: 8,
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderRadius: 10, padding: 12,
    marginTop: 12,
  },
  errorText: { color: '#ef4444', fontSize: 14 },
  createBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 14, padding: 18,
    alignItems: 'center', marginTop: 24,
  },
  createBtnDisabled: { backgroundColor: '#a5b4fc' },
  createBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
})