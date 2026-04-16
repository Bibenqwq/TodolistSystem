import { createClient } from '@supabase/supabase-js';

// !!! PAALALA/IMPORTANT !!!
// Nakalimutan mong ibigay ang iyong Supabase Project URL (e.g. https://xxx.supabase.co).
// Kunin mo iyon sa Supabase Dashboard mo (Settings > API) at ipalit dito sa baba!
// Pinalitan ko ng valid dummy URL na may "https://" para hindi mag-white screen ang app mo habang wala pang totoong URL.
const SUPABASE_URL = 'https://cvpydnhykuqmommioztw.supabase.co';

// Eto ang iyong Publishable API Key na ginagamit for frontend/browser requests.
const SUPABASE_ANON_KEY = 'sb_publishable_IvEE-OP6A3uZarJQ5Xgiow_z9ynv4C7';

// HINDI NATIN GINAGAMIT ANG SECRET KEY O PASSWORD MO DITO.  
// Wag na wag mong ilalagay ang Secret Key o Database Password (bibendncr123) 
// sa kahit anong frontend file para iwas hack!

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
