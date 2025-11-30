import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

export const supabase = createClient(
    "https://diyxtkreoplqmzkhzgci.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpeXh0a3Jlb3BscW16a2h6Z2NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzYyNTIsImV4cCI6MjA4MDAxMjI1Mn0.Nrezrpt39WBNYLJ6LvzKx_X0s5wcXbRWMvReglsfoc0"
);
