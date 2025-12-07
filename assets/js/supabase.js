import { createClient } from "https://esm.sh/@supabase/supabase-js"; 


const SUPABASE_URL = "https://diyxtkreoplqmzkhzgci.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpeXh0a3Jlb3BscW16a2h6Z2NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzYyNTIsImV4cCI6MjA4MDAxMjI1Mn0.Nrezrpt39WBNYLJ6LvzKx_X0s5wcXbRWMvReglsfoc0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
