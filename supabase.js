// ===========================================
// ARCHIVO: supabase.js
// ===========================================

// Reemplaza estas con tus credenciales reales de Supabase
const SUPABASE_URL = 'https://kbdwenmfmsuhlujwqdzv.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiZHdlbm1mbXN1aGx1andxZHp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MTEwNTIsImV4cCI6MjA3ODk4NzA1Mn0._wQBsCL-pqgrh9A2iaK9bqi8zRf-QLs8QWFq7Pv7HCc'; 

// Inicializa el cliente de Supabase
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Este archivo debe cargarse ANTES de cualquier otro script que use la variable 'supabase'.