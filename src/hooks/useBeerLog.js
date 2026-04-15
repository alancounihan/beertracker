import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { calculateUnits } from '../lib/units'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, format } from 'date-fns'

export function useBeerLog(userId) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const addBeer = useCallback(async ({ beerName, volumeMl, abv, timestamp }) => {
    if (!userId) throw new Error('Not authenticated')
    setLoading(true)
    setError(null)

    try {
      const units = calculateUnits(volumeMl, abv)
      const { data, error } = await supabase
        .from('beer_logs')
        .insert({
          user_id: userId,
          beer_name: beerName || null,
          volume_ml: volumeMl,
          abv_percent: abv,
          units: units,
          logged_at: timestamp || new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [userId])

  const deleteBeer = useCallback(async (id) => {
    if (!userId) throw new Error('Not authenticated')
    const { error } = await supabase
      .from('beer_logs')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
  }, [userId])

  const updateBeer = useCallback(async (id, updates) => {
    if (!userId) throw new Error('Not authenticated')
    const fields = { ...updates }
    if (fields.volumeMl !== undefined || fields.abv !== undefined) {
      // Recalculate units if volume or abv changed
      fields.units = calculateUnits(
        fields.volume_ml || fields.volumeMl,
        fields.abv_percent || fields.abv
      )
    }
    const { data, error } = await supabase
      .from('beer_logs')
      .update(fields)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }, [userId])

  const getTodayLogs = useCallback(async () => {
    if (!userId) return []
    const now = new Date()
    const { data, error } = await supabase
      .from('beer_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', startOfDay(now).toISOString())
      .lte('logged_at', endOfDay(now).toISOString())
      .order('logged_at', { ascending: false })

    if (error) throw error
    return data || []
  }, [userId])

  const getWeekLogs = useCallback(async (date = new Date()) => {
    if (!userId) return []
    const { data, error } = await supabase
      .from('beer_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', startOfWeek(date, { weekStartsOn: 1 }).toISOString())
      .lte('logged_at', endOfWeek(date, { weekStartsOn: 1 }).toISOString())
      .order('logged_at', { ascending: true })

    if (error) throw error
    return data || []
  }, [userId])

  const getLogsByPeriod = useCallback(async (period) => {
    if (!userId) return []
    const now = new Date()
    let start

    if (period === 'week') {
      start = startOfWeek(now, { weekStartsOn: 1 })
    } else if (period === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1)
    } else if (period === 'year') {
      start = new Date(now.getFullYear(), 0, 1)
    }

    const { data, error } = await supabase
      .from('beer_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', start.toISOString())
      .lte('logged_at', now.toISOString())
      .order('logged_at', { ascending: true })

    if (error) throw error
    return data || []
  }, [userId])

  return {
    loading,
    error,
    addBeer,
    deleteBeer,
    updateBeer,
    getTodayLogs,
    getWeekLogs,
    getLogsByPeriod,
  }
}
