import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
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

    const { sessionId, guideId } = await req.json();
    if (!sessionId || !guideId) throw new Error("sessionId e guideId são obrigatórios");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ success: false, error: "Pagamento não concluído" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Upsert purchase record
    await supabaseAdmin.from("guide_purchases").upsert({
      user_id: user.id,
      guide_id: guideId,
      stripe_session_id: sessionId,
      stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
      status: "completed",
    }, { onConflict: "user_id,guide_id" });

    // Generate signed URL for download (1 hour)
    const { data: guide } = await supabaseAdmin
      .from("digital_guides")
      .select("file_path")
      .eq("id", guideId)
      .single();

    if (!guide?.file_path) {
      return new Response(JSON.stringify({ success: true, downloadUrl: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const { data: signedData } = await supabaseAdmin.storage
      .from("digital-guides")
      .createSignedUrl(guide.file_path, 3600);

    return new Response(JSON.stringify({ success: true, downloadUrl: signedData?.signedUrl || null }), {
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
