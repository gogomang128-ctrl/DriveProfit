-- Device enrollment, not proof of phone ownership. No public read or list API.
CREATE TABLE public.driver_profiles (
  device_hash bytea PRIMARY KEY,
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 2 AND 64),
  phone text NOT NULL CHECK (phone ~ '^\+201[0125][0-9]{8}$'),
  consent_version integer NOT NULL CHECK (consent_version = 1),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX driver_profiles_created_idx ON public.driver_profiles(created_at);
ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.driver_profiles FROM PUBLIC, anon, authenticated;
CREATE FUNCTION public.register_driver(p_device text,p_name text,p_phone text,p_consent integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE h bytea;
BEGIN
  IF p_device IS NULL OR p_device !~ '^[a-f0-9]{64}$' OR p_consent IS DISTINCT FROM 1
    OR p_phone IS NULL OR p_phone !~ '^\+201[0125][0-9]{8}$' OR p_name IS NULL
    OR char_length(btrim(p_name)) NOT BETWEEN 2 AND 64 OR p_name ~ '[[:cntrl:]]'
  THEN RAISE EXCEPTION 'invalid profile'; END IF;
  h := sha256(decode(p_device,'hex'));
  PERFORM pg_advisory_xact_lock(624117);
  IF NOT EXISTS(SELECT 1 FROM public.driver_profiles WHERE device_hash=h)
    AND (SELECT count(*) FROM public.driver_profiles WHERE created_at>now()-interval '1 minute') >= 120
  THEN RAISE EXCEPTION 'try later'; END IF;
  INSERT INTO public.driver_profiles(device_hash,display_name,phone,consent_version)
    VALUES(h,btrim(p_name),p_phone,1) ON CONFLICT(device_hash) DO UPDATE
    SET display_name=excluded.display_name,phone=excluded.phone;
  RETURN true;
END $$;
CREATE FUNCTION public.erase_driver(p_device text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF p_device IS NULL OR p_device !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'invalid device'; END IF;
  DELETE FROM public.driver_profiles WHERE device_hash=sha256(decode(p_device,'hex'));
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.register_driver(text,text,text,integer),public.erase_driver(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_driver(text,text,text,integer),public.erase_driver(text) TO anon,authenticated;
