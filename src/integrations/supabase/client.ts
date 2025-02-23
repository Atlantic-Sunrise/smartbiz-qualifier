
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://stzmklayujbxxswpbqtb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0em1rbGF5dWpieHhzd3BicXRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzMjQ5OTUsImV4cCI6MjA1NTkwMDk5NX0.T2ifa7_g3A_FAhGX1ujANkmoIG00Cm2_pqKg_GsaqmI";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
