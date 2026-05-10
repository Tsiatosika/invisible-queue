import React, { useEffect, useState, useMemo } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, TextInput
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import QueueCard from '../components/QueueCard'
import { supabase } from '../../lib/supabase'

export default function HomeScreen({ navigation }) {
  const { user, signOut } = useAuth()
  const { theme, isDark, toggleTheme } = useTheme()
  const [queues, setQueues] = useState([])
  const [fetching, setFetching] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { loadQueues() }, [])

  const loadQueues = async () => {
    setFetching(true)
    const { data, error } = await supabase
      .from('queues')
      .select('*, queue_entries(count)')
      .order('created_at', { ascending: false })
    if (!error && data) setQueues(data)
    setFetching(false)
  }

  const filteredQueues = useMemo(() => {
    if (!search.trim()) return queues
    return queues.filter(q =>
      q.name.toLowerCase().includes(search.toLowerCase().trim())
    )
  }, [queues, search])

  if (fetching) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={[styles.loadingText, { color: theme.subtext }]}>Chargement...</Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.header }]}>
        <View>
          <Text style={[styles.title, { color: theme.headerText }]}>Invisible Queue</Text>
          <View style={styles.userRow}>
            <Ionicons name={user ? 'person-circle-outline' : 'person-outline'} size={14} color={theme.headerSub} />
            <Text style={[styles.subtitle, { color: theme.headerSub }]}>
              {' '}{user ? user.email : 'Mode invité'}
            </Text>
          </View>
        </View>
        <View style={styles.headerButtons}>
          {/* Toggle dark mode */}
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: theme.iconBg }]} onPress={toggleTheme}>
            <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={20} color={theme.iconColor} />
          </TouchableOpacity>
          {user && (
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: theme.iconBg }]} onPress={() => navigation.navigate('CreateQueue')}>
              <Ionicons name="add" size={24} color={theme.iconColor} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: theme.iconBg }]}
            onPress={() => user ? navigation.navigate('Profile') : navigation.navigate('Login')}
          >
            <Ionicons name={user ? 'person-circle-outline' : 'log-in-outline'} size={22} color={theme.iconColor} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Recherche */}
      <View style={[styles.searchContainer, { backgroundColor: theme.header }]}>
        <View style={[styles.searchBar, { backgroundColor: theme.card }]}>
          <Ionicons name="search-outline" size={18} color={theme.placeholder} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Rechercher une file..."
            placeholderTextColor={theme.placeholder}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={theme.placeholder} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Compteur */}
      <View style={[styles.countBar, { backgroundColor: theme.countBar }]}>
        <Ionicons name="list-outline" size={14} color={theme.countText} />
        <Text style={[styles.countText, { color: theme.countText }]}>
          {' '}{search.trim()
            ? `${filteredQueues.length} résultat${filteredQueues.length !== 1 ? 's' : ''} pour "${search}"`
            : `${queues.length} file${queues.length !== 1 ? 's' : ''} disponible${queues.length !== 1 ? 's' : ''}`
          }
        </Text>
      </View>

      {/* Liste */}
      <FlatList
        data={filteredQueues}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <QueueCard
            queue={item}
            distance={0}
            theme={theme}
            onPress={() => navigation.navigate('QueueDetail', { queue: item })}
            onManage={
              user && item.created_by === user.id
                ? () => navigation.navigate('QueueManager', { queue: item })
                : null
            }
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            {search.trim() ? (
              <>
                <Ionicons name="search-outline" size={64} color={theme.border} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>Aucun résultat</Text>
                <Text style={[styles.emptyText, { color: theme.subtext }]}>
                  Aucune file ne correspond à "{search}"
                </Text>
                <TouchableOpacity style={styles.clearBtn} onPress={() => setSearch('')}>
                  <Text style={styles.clearBtnText}>Effacer la recherche</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Ionicons name="location-outline" size={64} color={theme.border} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>Aucune file disponible</Text>
                <Text style={[styles.emptyText, { color: theme.subtext }]}>
                  Aucune file d'attente n'est disponible.
                </Text>
              </>
            )}
          </View>
        }
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={fetching} onRefresh={loadQueues} />}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 20, paddingTop: 40,
  },
  title: { fontSize: 22, fontWeight: 'bold' },
  userRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  subtitle: { fontSize: 12 },
  headerButtons: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center',
  },
  searchContainer: { paddingHorizontal: 16, paddingBottom: 16 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, paddingHorizontal: 12,
    paddingVertical: 10, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  countBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10 },
  countText: { fontWeight: '600', fontSize: 13 },
  list: { padding: 16, paddingBottom: 40 },
  empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  clearBtn: { marginTop: 16, backgroundColor: '#4f46e5', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  clearBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
})
