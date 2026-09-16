import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xzsgqcakflmdfb8javx.supabase.co';
const supabaseAnonKey = 'sb_publishable_A3dXjDEQUNkqtL7y7VWjow_9CW26KRN';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSupabase() {
  console.log('Testing connection to Supabase:', supabaseUrl);

  try {
    const { data: checkpoints, error: cpErr } = await supabase
      .from('checkpoints')
      .select('*');

    if (cpErr) {
      console.log('checkpoints table query result:', cpErr.message);
    } else {
      console.log(`checkpoints table found! Rows count: ${checkpoints.length}`);
    }

    const { data: teams, error: teamsErr } = await supabase
      .from('teams')
      .select('*')
      .limit(5);

    if (teamsErr) {
      console.log('teams table query result:', teamsErr.message);
    } else {
      console.log(`teams table found! Rows count: ${teams.length}`);
    }
  } catch (err) {
    console.error('Connection test error:', err.message);
  }
}

checkSupabase();
