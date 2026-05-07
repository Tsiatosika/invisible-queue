import { useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'

export function useNotifications(entryId, queueId, onNotify) {
  const channelRef = useRef(null)
  const notifiedRef = useRef({ near: false, next: false })

  useEffect(() => {
    if (!entryId || !queueId) return

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabase
      .channel('notif_' + Date.now())
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'queue_entries',
      }, async () => {
        // Compte les personnes devant
        const { data: myEntry } = await supabase
          .from('queue_entries')
          .select('position')
          .eq('id', entryId)
          .maybeSingle()

        if (!myEntry) return

        const { count } = await supabase
          .from('queue_entries')
          .select('*', { count: 'exact', head: true })
          .eq('queue_id', queueId)
          .eq('status', 'waiting')
          .lt('position', myEntry.position)

        const ahead = count ?? 0

        // Notification : bientôt votre tour (3 personnes devant)
        if (ahead <= 3 && ahead > 0 && !notifiedRef.current.near) {
          notifiedRef.current.near = true
          onNotify({
            type: 'near',
            message: `⏰ Plus que ${ahead} personne${ahead > 1 ? 's' : ''} avant votre tour !`,
          })
        }

        // Notification : c'est votre tour
        if (ahead === 0 && !notifiedRef.current.next) {
          notifiedRef.current.next = true
          onNotify({
            type: 'next',
            message: "🔔 C'est votre tour ! Présentez-vous.",
          })
        }
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [entryId, queueId])
}