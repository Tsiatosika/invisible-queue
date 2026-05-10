import React, { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Modal, TextInput
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../../lib/supabase'

export default function ProfileScreen({ navigation }) {
  const { user, signOut } = useAuth()
  const { theme, isDark, toggleTheme } = useTheme()
  const [stats, setStats] = useState({ totalJoined: 0, totalCreated: 0, totalServed: 0 })
  const [loading, setLoading] = useState(true)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  useEffect(() => { if (user) fetchStats() }, [user])

  const fetchStats = async () => {
    setLoading(true)
    const { count: joined } = await supabase.from('queue_entries').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
    const { count: created } = await supabase.from('queues').select('*', { count: 'exact', head: true }).eq('created_by', user.id)
    const { count: served } = await supabase.from('queue_entries').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'served')
    setStats({ totalJoined: joined ?? 0, totalCreated: created ?? 0, totalServed: served ?? 0 })
    setLoading(false)
  }

  const handleChangePassword = async () => {
    setPasswordError('')
    if (!newPassword || !confirmPassword) { setPasswordError('Veuillez remplir tous les champs'); return }
    if (newPassword.length < 6) { setPasswordError('Minimum 6 caractères'); return }
    if (newPassword !== confirmPassword) { setPasswordError('Les mots de passe ne correspondent pas'); return }
    setPasswordLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPasswordLoading(false)
    if (error) { setPasswordError(error.message) } else {
      setPasswordSuccess(true)
      setNewPassword(''); setConfirmPassword('')
      setTimeout(() => { setPasswordSuccess(false); setShowPasswordModal(false) }, 2000)
    }
  }

  const handleSignOut = async () => {
    setShowLogoutModal(false)
    await signOut()
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
  }

  const getInitials = () => user?.email?.charAt(0).toUpperCase() ?? '?'

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]}>

      {/* Modal mot de passe */}
      <Modal visible={showPasswordModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.card }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>Changer le mot de passe</Text>
            {passwordSuccess ? (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={48} color="#22c55e" />
                <Text style={styles.successText}>Mot de passe modifié !</Text>
              </View>
            ) : (
              <>
                <TextInput style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]} placeholder="Nouveau mot de passe" placeholderTextColor={theme.placeholder} value={newPassword} onChangeText={setNewPassword} secureTextEntry />
                <TextInput style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]} placeholder="Confirmer le mot de passe" placeholderTextColor={theme.placeholder} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
                {passwordError ? (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
                    <Text style={styles.errorText}> {passwordError}</Text>
                  </View>
                ) : null}
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={[styles.modalCancel, { borderColor: theme.border }]} onPress={() => { setShowPasswordModal(false); setPasswordError(''); setNewPassword(''); setConfirmPassword('') }}>
                    <Text style={[styles.modalCancelText, { color: theme.subtext }]}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalConfirm} onPress={handleChangePassword} disabled={passwordLoading}>
                    {passwordLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalConfirmText}>Confirmer</Text>}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal déconnexion */}
      <Modal visible={showLogoutModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBoxCenter, { backgroundColor: theme.card }]}>
            <Ionicons name="log-out-outline" size={48} color="#ef4444" />
            <Text style={[styles.modalTitle, { color: theme.text }]}>Se déconnecter ?</Text>
            <Text style={[styles.modalSubText, { color: theme.subtext }]}>Vous devrez vous reconnecter pour accéder à votre compte.</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalCancel, { borderColor: theme.border }]} onPress={() => setShowLogoutModal(false)}>
                <Text style={[styles.modalCancelText, { color: theme.subtext }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmRed} onPress={handleSignOut}>
                <Text style={styles.modalConfirmText}>Déconnexion</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.header }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back-outline" size={20} color={theme.headerSub} />
          <Text style={[styles.backText, { color: theme.headerSub }]}> Retour</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.headerText }]}>Mon profil</Text>
      </View>

      {/* Avatar */}
      <View style={[styles.avatarSection, { backgroundColor: theme.card, borderBottomColor: theme.separator }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials()}</Text>
        </View>
        <Text style={[styles.email, { color: theme.text }]}>{user?.email}</Text>
        <View style={[styles.accountBadge, { backgroundColor: theme.badge }]}>
          <Ionicons name="shield-checkmark-outline" size={14} color={theme.badgeText} />
          <Text style={[styles.accountBadgeText, { color: theme.badgeText }]}> Compte vérifié</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.subtext }]}>Mes statistiques</Text>
        {loading ? <ActivityIndicator color="#4f46e5" style={{ marginTop: 16 }} /> : (
          <View style={styles.statsRow}>
            {[
              { icon: 'enter-outline', value: stats.totalJoined, label: 'Files rejointes', color: '#4f46e5' },
              { icon: 'checkmark-done-outline', value: stats.totalServed, label: 'Fois servi', color: '#22c55e' },
              { icon: 'add-circle-outline', value: stats.totalCreated, label: 'Files créées', color: '#f59e0b' },
            ].map((s, i) => (
              <View key={i} style={[styles.statCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
                <Ionicons name={s.icon} size={24} color={s.color} />
                <Text style={[styles.statValue, { color: theme.text }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: theme.subtext }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Menu */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.subtext }]}>Mon compte</Text>
        <View style={[styles.menuCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>

          {/* Dark mode toggle */}
          <TouchableOpacity style={styles.menuItem} onPress={toggleTheme}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={20} color={isDark ? '#f59e0b' : '#4f46e5'} />
              </View>
              <Text style={[styles.menuText, { color: theme.text }]}>
                {isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
              </Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={18} color={theme.border} />
          </TouchableOpacity>

          <View style={[styles.menuSeparator, { backgroundColor: theme.separator }]} />

          <TouchableOpacity style={styles.menuItem} onPress={() => setShowPasswordModal(true)}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#ede9fe' }]}>
                <Ionicons name="lock-closed-outline" size={20} color="#4f46e5" />
              </View>
              <Text style={[styles.menuText, { color: theme.text }]}>Changer le mot de passe</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={18} color={theme.border} />
          </TouchableOpacity>

          <View style={[styles.menuSeparator, { backgroundColor: theme.separator }]} />

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('CreateQueue')}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#fef9c3' }]}>
                <Ionicons name="add-circle-outline" size={20} color="#f59e0b" />
              </View>
              <Text style={[styles.menuText, { color: theme.text }]}>Créer une file</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={18} color={theme.border} />
          </TouchableOpacity>

          <View style={[styles.menuSeparator, { backgroundColor: theme.separator }]} />

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Home')}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="list-outline" size={20} color="#22c55e" />
              </View>
              <Text style={[styles.menuText, { color: theme.text }]}>Voir les files</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={18} color={theme.border} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Déconnexion */}
      <View style={styles.section}>
        <TouchableOpacity style={[styles.logoutBtn, { borderColor: '#ef4444' }]} onPress={() => setShowLogoutModal(true)}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutText}> Se déconnecter</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.version, { color: theme.border }]}>Invisible Queue — MVP v1.0</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  backText: { fontSize: 14 },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  avatarSection: { alignItems: 'center', padding: 24, borderBottomWidth: 1 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#4f46e5', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: '900', color: '#fff' },
  email: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  accountBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  accountBadgeText: { fontSize: 12, fontWeight: '600' },
  section: { padding: 16, paddingBottom: 0 },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  statValue: { fontSize: 24, fontWeight: '900', marginTop: 8 },
  statLabel: { fontSize: 11, textAlign: 'center', marginTop: 4 },
  menuCard: { borderRadius: 16, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuText: { fontSize: 15, fontWeight: '500' },
  menuSeparator: { height: 1, marginLeft: 64 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderRadius: 14, padding: 16, marginTop: 8 },
  logoutText: { color: '#ef4444', fontSize: 16, fontWeight: '700' },
  version: { textAlign: 'center', fontSize: 12, marginTop: 24, marginBottom: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalBoxCenter: { borderRadius: 20, margin: 24, padding: 24, alignItems: 'center' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginTop: 12, marginBottom: 16 },
  modalSubText: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 12 },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fee2e2', borderRadius: 10, padding: 10, marginBottom: 12 },
  errorText: { color: '#ef4444', fontSize: 13 },
  successBox: { alignItems: 'center', padding: 24 },
  successText: { fontSize: 16, fontWeight: '700', color: '#22c55e', marginTop: 12 },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalCancel: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
  modalCancelText: { fontWeight: '600' },
  modalConfirm: { flex: 1, backgroundColor: '#4f46e5', borderRadius: 12, padding: 14, alignItems: 'center' },
  modalConfirmRed: { flex: 1, backgroundColor: '#ef4444', borderRadius: 12, padding: 14, alignItems: 'center' },
  modalConfirmText: { color: '#fff', fontWeight: '700' },
})