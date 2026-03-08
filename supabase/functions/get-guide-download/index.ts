import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseAdmin.auth.getUser(token);
    const user = userData.user;
    if (!user) throw new Error("Usuário não autenticado");

    const url = new URL(req.url);
    const guideId = url.searchParams.get("guide_id");
    if (!guideId) throw new Error("guide_id é obrigatório");

    // Check if user has a completed purchase
    const { data: purchase } = await supabaseAdmin
      .from("guide_purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("guide_id", guideId)
      .eq("status", "completed")
      .maybeSingle();

    if (!purchase) {
      return new Response(JSON.stringify({ error: "Compra não encontrada" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    const { data: guide } = await supabaseAdmin
      .from("digital_guides")
      .select("file_path, title")
      .eq("id", guideId)
      .single();

    if (!guide?.file_path) {
      return new Response(JSON.stringify({ error: "Arquivo não disponível" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    const { data: signedData } = await supabaseAdmin.storage
      .from("digital-guides")
      .createSignedUrl(guide.file_path, 3600);

    return new Response(JSON.stringify({ downloadUrl: signedData?.signedUrl || null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
