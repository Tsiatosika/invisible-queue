import { useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'

export function useNotifications(entryId, queueId, onNotify) {
  const channelRef = useRef(null)
  const notifiedRef = useRef({ near: false, next: false })
  const prevAheadRef = useRef(null)

  useEffect(() => {
    if (!entryId || !queueId) return

    // Vérifie la position immédiatement au montage
    checkPosition()

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabase
      .channel('notif_' + entryId + '_' + Date.now())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'queue_entries',
      }, () => {
        // Déclenche la vérification à chaque changement dans la table
        checkPosition()
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

  const checkPosition = async () => {
    // Récupère ma position actuelle
    const { data: myEntry } = await supabase
      .from('queue_entries')
      .select('position, status')
      .eq('id', entryId)
      .maybeSingle()

    if (!myEntry) return
    if (myEntry.status !== 'waiting') return

    // Compte les personnes devant moi
    const { count } = await supabase
      .from('queue_entries')
      .select('*', { count: 'exact', head: true })
      .eq('queue_id', queueId)
      .eq('status', 'waiting')
      .lt('position', myEntry.position)

    const ahead = count ?? 0

    // Évite les notifications en double si la position n'a pas changé
    if (prevAheadRef.current === ahead) return
    prevAheadRef.current = ahead

    // C'est mon tour (0 personnes devant)
    if (ahead === 0 && !notifiedRef.current.next) {
      notifiedRef.current.next = true
      notifiedRef.current.near = true
      onNotify({
        type: 'next',
        message: "C'est votre tour ! Présentez-vous maintenant.",
      })
      return
    }

    // Bientôt mon tour (3 personnes ou moins devant)
    if (ahead > 0 && ahead <= 3 && !notifiedRef.current.near) {
      notifiedRef.current.near = true
      onNotify({
        type: 'near',
        message: `Plus que ${ahead} personne${ahead > 1 ? 's' : ''} avant vous !`,
      })
    }
  }
}
