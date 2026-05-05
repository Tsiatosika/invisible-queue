import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://saoroysvomrrptxmzpoc.supabase.co/rest/v1/'   
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhb3JveXN2b21ycnB0eG16cG9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MzMwNjQsImV4cCI6MjA5MzUwOTA2NH0.4pQPwFdND8sczVnrN-iQItgDzbcylLGa4EqU_zdJ62g'          

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})