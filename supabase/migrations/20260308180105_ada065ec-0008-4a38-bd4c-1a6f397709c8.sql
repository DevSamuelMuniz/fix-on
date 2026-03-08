-- Habilitar extensão pg_net para chamadas HTTP
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Criar função que chama a edge function via HTTP ao receber nova mensagem de contato
CREATE OR REPLACE FUNCTION public.notify_contact_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  edge_function_url text;
  payload jsonb;
BEGIN
  edge_function_url := 'https://dcvlrtxtepxmafiburip.supabase.co/functions/v1/contact-notification';

  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'record', row_to_json(NEW)::jsonb
  );

  PERFORM net.http_post(
    url := edge_function_url,
    body := payload::text,
    headers := '{"Content-Type": "application/json"}'::jsonb
  );

  RETURN NEW;
END;
$$;

-- Criar trigger que dispara após inserção na tabela contact_messages
DROP TRIGGER IF EXISTS trigger_notify_contact_message ON public.contact_messages;

CREATE TRIGGER trigger_notify_contact_message
  AFTER INSERT ON public.contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_contact_message();