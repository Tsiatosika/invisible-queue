import React, { useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, Animated
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'

export default function LoginScreen({ navigation }) {
  const { signIn, signUp, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const errorAnim = new Animated.Value(0)

  useEffect(() => {
    if (user) {
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] })
    }
  }, [user])

  // Animation de secousse quand erreur
  const shakeError = () => {
    Animated.sequence([
      Animated.timing(errorAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(errorAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(errorAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(errorAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start()
  }

  // Traduit les messages d'erreur Supabase en français
  const getErrorMessage = (error) => {
    const msg = error.message?.toLowerCase() || ''

    if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
      return 'Email ou mot de passe incorrect'
    }
    if (msg.includes('email not confirmed')) {
      return 'Veuillez confirmer votre email avant de vous connecter'
    }
    if (msg.includes('user already registered') || msg.includes('already been registered')) {
      return 'Un compte existe déjà avec cet email'
    }
    if (msg.includes('password should be at least')) {
      return 'Le mot de passe doit contenir au moins 6 caractères'
    }
    if (msg.includes('unable to validate email address')) {
      return 'Adresse email invalide'
    }
    if (msg.includes('email address is invalid') || msg.includes('invalid email')) {
      return 'Adresse email invalide'
    }
    if (msg.includes('signup is disabled')) {
      return 'Les inscriptions sont temporairement désactivées'
    }
    if (msg.includes('too many requests') || msg.includes('rate limit')) {
      return 'Trop de tentatives. Réessayez dans quelques minutes'
    }
    if (msg.includes('network') || msg.includes('fetch')) {
      return 'Erreur de connexion. Vérifiez votre réseau'
    }

    return 'Une erreur est survenue. Réessayez.'
  }

  const validateForm = () => {
    if (!email.trim()) {
      setError('Veuillez entrer votre email')
      shakeError()
      return false
    }
    if (!email.includes('@') || !email.includes('.')) {
      setError('Adresse email invalide')
      shakeError()
      return false
    }
    if (!password) {
      setError('Veuillez entrer votre mot de passe')
      shakeError()
      return false
    }
    if (!isLogin && password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      shakeError()
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    setError('')
    if (!validateForm()) return

    setLoading(true)
    try {
      if (isLogin) {
        await signIn(email.trim(), password)
      } else {
        await signUp(email.trim(), password)
        setError('')
        setIsLogin(true)
        setPassword('')
      }
    } catch (err) {
      const msg = getErrorMessage(err)
      setError(msg)
      shakeError()
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => {
    setIsLogin(!isLogin)
    setError('')
    setPassword('')
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <View style={styles.logoBox}>
          <Ionicons name="list" size={36} color="#fff" />
        </View>
        <Text style={styles.appName}>Invisible Queue</Text>
        <Text style={styles.headerSub}>
          {isLogin ? 'Connectez-vous à votre compte' : 'Créez votre compte'}
        </Text>
      </View>

      <View style={styles.form}>

        {/* Email */}
        <Text style={styles.label}>Email</Text>
        <View style={[styles.inputWrapper, error && error.toLowerCase().includes('email') && styles.inputError]}>
          <Ionicons name="mail-outline" size={18} color="#999" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="votre@email.com"
            placeholderTextColor="#bbb"
            value={email}
            onChangeText={(v) => { setEmail(v); setError('') }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Mot de passe */}
        <Text style={styles.label}>Mot de passe</Text>
        <View style={[styles.inputWrapper, error && error.toLowerCase().includes('mot de passe') && styles.inputError]}>
          <Ionicons name="lock-closed-outline" size={18} color="#999" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder={isLogin ? '••••••••' : 'Minimum 6 caractères'}
            placeholderTextColor="#bbb"
            value={password}
            onChangeText={(v) => { setPassword(v); setError('') }}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={18} color="#999"
            />
          </TouchableOpacity>
        </View>

        {error ? (
          <Animated.View
            style={[styles.errorBox, { transform: [{ translateX: errorAnim }] }]}
          >
            <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
            <Text style={styles.errorText}> {error}</Text>
          </Animated.View>
        ) : null}

        {/* Bouton principal */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons
                name={isLogin ? 'log-in-outline' : 'person-add-outline'}
                size={18} color="#fff"
              />
              <Text style={styles.submitBtnText}>
                {' '}{isLogin ? 'Se connecter' : "S'inscrire"}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.switchBtn} onPress={switchMode}>
          <Text style={styles.switchText}>
            {isLogin ? "Pas encore de compte ? " : 'Déjà un compte ? '}
            <Text style={styles.switchLink}>
              {isLogin ? "S'inscrire" : 'Se connecter'}
            </Text>
          </Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OU</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.guestBtn}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] })}
        >
          <Ionicons name="person-outline" size={18} color="#4f46e5" />
          <Text style={styles.guestBtnText}> Continuer en tant qu'invité</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },

  // Header
  header: {
    backgroundColor: '#4f46e5',
    paddingTop: 60, paddingBottom: 40,
    alignItems: 'center',
  },
  logoBox: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  appName: {
    fontSize: 28, fontWeight: '900',
    color: '#fff', marginBottom: 6,
  },
  headerSub: {
    fontSize: 14, color: 'rgba(255,255,255,0.7)',
  },

  // Formulaire
  form: {
    flex: 1, padding: 24, paddingTop: 32,
  },
  label: {
    fontSize: 13, fontWeight: '700',
    color: '#374151', marginBottom: 6, marginTop: 16,
  },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5, borderColor: '#e5e7eb',
    borderRadius: 12, paddingHorizontal: 12,
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fff5f5',
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1, padding: 14,
    fontSize: 15, color: '#1a1a2e',
  },
  eyeBtn: { padding: 8 },

  // Erreur
  errorBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderWidth: 1, borderColor: '#fecaca',
    borderRadius: 10, padding: 12,
    marginTop: 12,
  },
  errorText: {
    color: '#ef4444', fontSize: 14,
    fontWeight: '500', flex: 1,
  },

  // Bouton principal
  submitBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4f46e5',
    borderRadius: 14, padding: 16,
    marginTop: 24,
  },
  submitBtnDisabled: { backgroundColor: '#a5b4fc' },
  submitBtnText: {
    color: '#fff', fontSize: 16, fontWeight: '700',
  },

  // Switch
  switchBtn: { alignItems: 'center', marginTop: 16 },
  switchText: { color: '#666', fontSize: 14 },
  switchLink: { color: '#4f46e5', fontWeight: '700' },

  // Divider
  divider: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e5e7eb' },
  dividerText: { marginHorizontal: 12, color: '#999', fontSize: 13 },

  // Invité
  guestBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#4f46e5',
    borderRadius: 14, padding: 14,
  },
  guestBtnText: { color: '#4f46e5', fontSize: 15, fontWeight: '600' },
})
