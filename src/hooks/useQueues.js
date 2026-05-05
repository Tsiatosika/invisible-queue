import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export function useQueues() {
  const [queues, setQueues] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQueues()

    // Écoute les changements en temps réel
    const subscription = supabase
      .channel('queues_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queues' }, () => {
        fetchQueues()
      })
      .subscribe()

    return () => supabase.removeChannel(subscription)
  }, [])

  const fetchQueues = async () => {
    const { data, error } = await supabase
      .from('queues')
      .select(`
        *,
        queue_entries(count)
      `)
      .order('created_at', { ascending: false })

    if (!error) setQueues(data || [])
    setLoading(false)
  }

  const createQueue = async (name, latitude, longitude, userId) => {
    const { data, error } = await supabase
      .from('queues')
      .insert({ name, latitude, longitude, created_by: userId })
      .select()
      .single()
    if (error) throw error
    return data
  }

  return { queues, loading, fetchQueues, createQueue }
}