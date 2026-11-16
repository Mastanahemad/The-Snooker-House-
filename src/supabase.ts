
import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://tsapjthonjxyxdfyndnv.supabase.co";

const SUPABASE_ANON_KEY = "sb_publishable_20xvbFljDzIU_f_BcdXYyQ_DkopHTn9";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
