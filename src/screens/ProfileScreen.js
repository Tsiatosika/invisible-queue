import React, { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Modal, TextInput
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../../lib/supabase'

export default function ProfileScreen({ navigation }) {
  const { user, signOut } = useAuth()
  const [stats, setStats] = useState({
    totalJoined: 0,
    totalCreated: 0,
    totalServed: 0,
  })
  const [loading, setLoading] = useState(true)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  useEffect(() => {
    if (user) fetchStats()
  }, [user])

  const fetchStats = async () => {
    setLoading(true)

    const { count: joined } = await supabase
      .from('queue_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const { count: created } = await supabase
      .from('queues')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', user.id)

    const { count: served } = await supabase
      .from('queue_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'served')

    setStats({
      totalJoined: joined ?? 0,
      totalCreated: created ?? 0,
      totalServed: served ?? 0,
    })
    setLoading(false)
  }

  const handleChangePassword = async () => {
    setPasswordError('')
    if (!newPassword || !confirmPassword) {
      setPasswordError('Veuillez remplir tous les champs')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas')
      return
    }

    setPasswordLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPasswordLoading(false)

    if (error) {
      setPasswordError(error.message)
    } else {
      setPasswordSuccess(true)
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => {
        setPasswordSuccess(false)
        setShowPasswordModal(false)
      }, 2000)
    }
  }

  const handleSignOut = async () => {
    setShowLogoutModal(false)
    await signOut()
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
  }

  const getInitials = () => {
    if (!user?.email) return '?'
    return user.email.charAt(0).toUpperCase()
  }

  return (
    <ScrollView style={styles.container}>

      {/* Modal changement mot de passe */}
      <Modal visible={showPasswordModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Changer le mot de passe</Text>

            {passwordSuccess ? (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={48} color="#22c55e" />
                <Text style={styles.successText}>Mot de passe modifié !</Text>
              </View>
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Nouveau mot de passe"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
                <TextInput
                  style={styles.input}
                  placeholder="Confirmer le mot de passe"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
                {passwordError ? (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
                    <Text style={styles.errorText}> {passwordError}</Text>
                  </View>
                ) : null}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.modalCancel}
                    onPress={() => {
                      setShowPasswordModal(false)
                      setPasswordError('')
                      setNewPassword('')
                      setConfirmPassword('')
                    }}
                  >
                    <Text style={styles.modalCancelText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalConfirm}
                    onPress={handleChangePassword}
                    disabled={passwordLoading}
                  >
                    {passwordLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.modalConfirmText}>Confirmer</Text>
                    )}
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
          <View style={styles.modalBoxCenter}>
            <Ionicons name="log-out-outline" size={48} color="#ef4444" />
            <Text style={styles.modalTitle}>Se déconnecter ?</Text>
            <Text style={styles.modalSubText}>
              Vous devrez vous reconnecter pour accéder à votre compte.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmRed}
                onPress={handleSignOut}
              >
                <Text style={styles.modalConfirmText}>Déconnexion</Text>
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
        <Text style={styles.headerTitle}>Mon profil</Text>
      </View>

      {/* Avatar + infos */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials()}</Text>
        </View>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.accountBadge}>
          <Ionicons name="shield-checkmark-outline" size={14} color="#4f46e5" />
          <Text style={styles.accountBadgeText}> Compte vérifié</Text>
        </View>
      </View>

      {/* Statistiques */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mes statistiques</Text>
        {loading ? (
          <ActivityIndicator color="#4f46e5" style={{ marginTop: 16 }} />
        ) : (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="enter-outline" size={24} color="#4f46e5" />
              <Text style={styles.statValue}>{stats.totalJoined}</Text>
              <Text style={styles.statLabel}>Files rejointes</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-done-outline" size={24} color="#22c55e" />
              <Text style={styles.statValue}>{stats.totalServed}</Text>
              <Text style={styles.statLabel}>Fois servi</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="add-circle-outline" size={24} color="#f59e0b" />
              <Text style={styles.statValue}>{stats.totalCreated}</Text>
              <Text style={styles.statLabel}>Files créées</Text>
            </View>
          </View>
        )}
      </View>

      {/* Actions du compte */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mon compte</Text>

        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowPasswordModal(true)}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#ede9fe' }]}>
                <Ionicons name="lock-closed-outline" size={20} color="#4f46e5" />
              </View>
              <Text style={styles.menuText}>Changer le mot de passe</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={18} color="#c7d2fe" />
          </TouchableOpacity>

          <View style={styles.menuSeparator} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('CreateQueue')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#fef9c3' }]}>
                <Ionicons name="add-circle-outline" size={20} color="#f59e0b" />
              </View>
              <Text style={styles.menuText}>Créer une file</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={18} color="#c7d2fe" />
          </TouchableOpacity>

          <View style={styles.menuSeparator} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Home')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="list-outline" size={20} color="#22c55e" />
              </View>
              <Text style={styles.menuText}>Voir les files</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={18} color="#c7d2fe" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Déconnexion */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => setShowLogoutModal(true)}
        >
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutText}> Se déconnecter</Text>
        </TouchableOpacity>
      </View>

      {/* Version */}
      <Text style={styles.version}>Invisible Queue — MVP v1.0</Text>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },

  // Header
  header: { backgroundColor: '#4f46e5', padding: 20, paddingTop: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  backText: { color: '#c7d2fe', fontSize: 14 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },

  // Avatar
  avatarSection: {
    alignItems: 'center', padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#4f46e5',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  avatarText: { fontSize: 32, fontWeight: '900', color: '#fff' },
  email: { fontSize: 16, fontWeight: '600', color: '#1a1a2e', marginBottom: 8 },
  accountBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#ede9fe', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  accountBadgeText: { color: '#4f46e5', fontSize: 12, fontWeight: '600' },

  // Sections
  section: { padding: 16, paddingBottom: 0 },
  sectionTitle: {
    fontSize: 13, fontWeight: '700',
    color: '#999', textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: 12,
  },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, backgroundColor: '#fff',
    borderRadius: 16, padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  statValue: { fontSize: 24, fontWeight: '900', color: '#1a1a2e', marginTop: 8 },
  statLabel: { fontSize: 11, color: '#999', textAlign: 'center', marginTop: 4 },

  // Menu
  menuCard: {
    backgroundColor: '#fff', borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: 16,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuText: { fontSize: 15, color: '#1a1a2e', fontWeight: '500' },
  menuSeparator: { height: 1, backgroundColor: '#f3f4f6', marginLeft: 64 },

  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#ef4444',
    borderRadius: 14, padding: 16, marginTop: 8,
  },
  logoutText: { color: '#ef4444', fontSize: 16, fontWeight: '700' },

  // Version
  version: {
    textAlign: 'center', color: '#c7d2fe',
    fontSize: 12, marginTop: 24, marginBottom: 40,
  },

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
  modalBoxCenter: {
    backgroundColor: '#fff', borderRadius: 20,
    margin: 24, padding: 24, alignItems: 'center',
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: '#e5e7eb',
    borderRadius: 2, alignSelf: 'center', marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18, fontWeight: '800',
    color: '#1a1a2e', marginTop: 12, marginBottom: 16,
  },
  modalSubText: {
    fontSize: 14, color: '#666',
    textAlign: 'center', marginBottom: 24,
  },
  input: {
    backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 12,
  },
  errorBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fee2e2', borderRadius: 10,
    padding: 10, marginBottom: 12,
  },
  errorText: { color: '#ef4444', fontSize: 13 },
  successBox: { alignItems: 'center', padding: 24 },
  successText: { fontSize: 16, fontWeight: '700', color: '#22c55e', marginTop: 12 },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalCancel: {
    flex: 1, borderWidth: 1, borderColor: '#ddd',
    borderRadius: 12, padding: 14, alignItems: 'center',
  },
  modalCancelText: { color: '#666', fontWeight: '600' },
  modalConfirm: {
    flex: 1, backgroundColor: '#4f46e5',
    borderRadius: 12, padding: 14, alignItems: 'center',
  },
  modalConfirmRed: {
    flex: 1, backgroundColor: '#ef4444',
    borderRadius: 12, padding: 14, alignItems: 'center',
  },
  modalConfirmText: { color: '#fff', fontWeight: '700' },
})
