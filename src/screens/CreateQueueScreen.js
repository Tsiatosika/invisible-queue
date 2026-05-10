import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, ScrollView
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../../lib/supabase'

export default function CreateQueueScreen({ navigation }) {
  const { user } = useAuth()
  const { theme } = useTheme()
  const [name, setName] = useState('')
  const [latitude, setLatitude] = useState('-18.9137')
  const [longitude, setLongitude] = useState('47.5361')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!name.trim()) { setError('Le nom de la file est obligatoire'); return }
    if (!latitude || !longitude) { setError('Les coordonnées sont obligatoires'); return }
    setError('')
    setLoading(true)
    try {
      const { error: err } = await supabase.from('queues').insert({
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
    if (!navigator.geolocation) { setError('Géolocalisation non disponible'); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toString())
        setLongitude(pos.coords.longitude.toString())
      },
      () => setError('Impossible de récupérer la position')
    )
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { backgroundColor: theme.header }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <View style={styles.backContent}>
            <Ionicons name="arrow-back" size={16} color={theme.headerSub} />
            <Text style={[styles.backText, { color: theme.headerSub }]}> Retour</Text>
          </View>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.headerText }]}>Créer une file</Text>
        <Text style={[styles.subtitle, { color: theme.headerSub }]}>Réservé aux utilisateurs connectés</Text>
      </View>

      <View style={styles.form}>
        <Text style={[styles.label, { color: theme.text }]}>Nom de la file *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
          placeholder="Ex: File Pharmacie Centrale"
          placeholderTextColor={theme.placeholder}
          value={name}
          onChangeText={setName}
        />

        <Text style={[styles.label, { color: theme.text }]}>Localisation</Text>

        <TouchableOpacity style={[styles.locationBtn, { backgroundColor: theme.badge }]} onPress={useCurrentLocation}>
          <Ionicons name="location-outline" size={18} color={theme.iconColor} style={styles.locationIcon} />
          <Text style={[styles.locationBtnText, { color: theme.countText }]}>Utiliser ma position actuelle</Text>
        </TouchableOpacity>

        <Text style={[styles.orText, { color: theme.placeholder }]}>— ou entrez manuellement —</Text>

        <Text style={[styles.sublabel, { color: theme.subtext }]}>Latitude</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
          placeholder="-18.9137"
          placeholderTextColor={theme.placeholder}
          value={latitude}
          onChangeText={setLatitude}
          keyboardType="numeric"
        />

        <Text style={[styles.sublabel, { color: theme.subtext }]}>Longitude</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
          placeholder="47.5361"
          placeholderTextColor={theme.placeholder}
          value={longitude}
          onChangeText={setLongitude}
          keyboardType="numeric"
        />

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="warning-outline" size={16} color={theme.danger} style={styles.errorIcon} />
            <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: theme.header }, (!name || loading) && { backgroundColor: theme.headerSub }]}
          onPress={handleCreate}
          disabled={!name || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.createBtnContent}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={styles.createBtnIcon} />
              <Text style={styles.createBtnText}>Créer la file</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 40 },
  backBtn: { marginBottom: 12 },
  backContent: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 14 },
  title: { fontSize: 26, fontWeight: 'bold' },
  subtitle: { fontSize: 13, marginTop: 4 },
  form: { padding: 20 },
  label: { fontSize: 15, fontWeight: '700', marginBottom: 8, marginTop: 16 },
  sublabel: { fontSize: 13, marginBottom: 6, marginTop: 8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 4 },
  locationBtn: { borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  locationIcon: { marginRight: 8 },
  locationBtnText: { fontWeight: '600', fontSize: 14 },
  orText: { textAlign: 'center', fontSize: 13, marginVertical: 8 },
  errorBox: { backgroundColor: '#fee2e2', borderRadius: 10, padding: 12, marginTop: 12, flexDirection: 'row', alignItems: 'center' },
  errorIcon: { marginRight: 8 },
  errorText: { fontSize: 14, flex: 1 },
  createBtn: { borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 24 },
  createBtnContent: { flexDirection: 'row', alignItems: 'center' },
  createBtnIcon: { marginRight: 8 },
  createBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
})