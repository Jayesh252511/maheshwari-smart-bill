import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-setup-token",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const token = req.headers.get("x-setup-token");
    const expected = Deno.env.get("ADMIN_SETUP_TOKEN");
    if (!expected || token !== expected) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ success: false, error: "Missing server config" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const targetEmail = "admin@gmail.com";
    const targetPassword = "admin123";

    // Find user by email (iterate pages)
    let adminUser: any = null;
    let page = 1;
    for (let i = 0; i < 10; i++) {
      const { data, error } = await (supabase as any).auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw error;
      const found = data?.users?.find((u: any) => (u.email || "").toLowerCase() === targetEmail);
      if (found) { adminUser = found; break; }
      if (!data || !data.users || data.users.length === 0) break;
      page += 1;
    }

    if (adminUser) {
      const { error: updateErr } = await (supabase as any).auth.admin.updateUserById(adminUser.id, {
        password: targetPassword,
        email_confirm: true,
      });
      if (updateErr) throw updateErr;
    } else {
      const { data: created, error: createErr } = await (supabase as any).auth.admin.createUser({
        email: targetEmail,
        password: targetPassword,
        email_confirm: true,
      });
      if (createErr) throw createErr;
      adminUser = created?.user;
    }

    // Ensure row exists in public.admins
    if (adminUser?.id) {
      const { error: upsertErr } = await supabase
        .from('admins')
        .upsert({ user_id: adminUser.id, email: targetEmail }, { onConflict: 'user_id' });
      if (upsertErr) throw upsertErr;
    }

    return new Response(JSON.stringify({ success: true, user_id: adminUser?.id }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: String(e) }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 500,
    });
  }
});
