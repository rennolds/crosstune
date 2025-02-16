import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hejjtwpmbfldwyknnamf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhlamp0d3BtYmZsZHd5a25uYW1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3NDI4MzUsImV4cCI6MjA1NTMxODgzNX0.kC9tPpFUX2eQCPHGayd61N6vPk4QpcuDt_3C5Vep6ic'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)






