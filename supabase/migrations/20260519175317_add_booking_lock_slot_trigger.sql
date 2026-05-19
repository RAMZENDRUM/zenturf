-- Add trigger function to handle slot lock/unlock on zenturf_bookings_v2
CREATE OR REPLACE FUNCTION public.handle_zenturf_booking_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.zenturf_slots_v2
      SET is_booked = true, booked_by = NEW.user_id
      WHERE id = NEW.slot_id;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
      UPDATE public.zenturf_slots_v2 
        SET is_booked = false, booked_by = NULL 
        WHERE id = NEW.slot_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS zenturf_booking_lock_slot ON public.zenturf_bookings_v2;
CREATE TRIGGER zenturf_booking_lock_slot
  AFTER INSERT OR UPDATE ON public.zenturf_bookings_v2
  FOR EACH ROW EXECUTE FUNCTION public.handle_zenturf_booking_change();
