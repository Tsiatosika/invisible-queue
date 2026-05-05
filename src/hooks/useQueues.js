import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'

export function useQueues() {
  const [queues, setQueues] = useState([])
  const [loading, setLoading] = useState(true)
  const channelRef = useRef(null)

  useEffect(() => {
    fetchQueues()

    // Nettoie l'ancien canal s'il existe
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabase
      .channel('queues_channel_' + Date.now())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queues' }, () => {
        fetchQueues()
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [])

  const fetchQueues = async () => {
    const { data, error } = await supabase
      .from('queues')
      .select('*, queue_entries(count)')
      .order('created_at', { ascending: false })

    if (!error && data) setQueues(data)
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

  const joinQueue = async (queueId, userId, guestName, guestEmail) => {
    const { data: entries } = await supabase
      .from('queue_entries')
      .select('position')
      .eq('queue_id', queueId)
      .eq('status', 'waiting')
      .order('position', { ascending: false })
      .limit(1)

    const nextPosition = entries && entries.length > 0 ? entries[0].position + 1 : 1

    const entry = {
      queue_id: queueId,
      position: nextPosition,
      status: 'waiting',
      missed_turns: 0,
    }

    if (userId) {
      entry.user_id = userId
    } else {
      entry.guest_name = guestName
      entry.guest_email = guestEmail
    }

    const { data, error } = await supabase
      .from('queue_entries')
      .insert(entry)
      .select()
      .single()

    if (error) throw error
    return data
  }

  const leaveQueue = async (entryId) => {
    const { error } = await supabase
      .from('queue_entries')
      .delete()
      .eq('id', entryId)
    if (error) throw error
  }

  return { queues, loading, fetchQueues, createQueue, joinQueue, leaveQueue }
}