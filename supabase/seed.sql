-- ============================================================
-- EasyDrift JAPN Car - Seed Data
-- Remplacer les dates ci-dessous par les vraies dates de l'événement
-- ============================================================

-- Variables de dates (modifier ici)
DO $$
DECLARE
  v_saturday date := '2026-05-30'; -- SAMEDI de l'événement
  v_sunday   date := '2026-05-31'; -- DIMANCHE de l'événement

  -- IDs des activités
  v_bapteme_id    uuid;
  v_conduite_id   uuid;
  v_carbooling_id uuid;

  -- Génération des créneaux
  v_day        date;
  v_start      time;
  v_end        time;
  v_slot_min   int;
  v_current    time;
  v_hour_start int;
BEGIN

-- ============================================================
-- 1. Insérer les activités
-- ============================================================

INSERT INTO activities (id, name, label, price, duration, color, description, capacity)
VALUES
  (uuid_generate_v4(), 'bapteme',    'Baptême Drift',        4000, 7,  '#F47B20', 'Montez à bord d''une voiture de drift pilotée par un professionnel et vivez la sensation unique du drift !', 5),
  (uuid_generate_v4(), 'conduite',   'Session Conduite',     5000, 6,  '#E67E22', 'Prenez le volant et pilotez vous-même sur le circuit de Montlhéry sous la supervision de nos instructeurs.', 1),
  (uuid_generate_v4(), 'carbooling', 'Car Booling CLIO',     2000, 4,  '#8E44AD', 'Découvrez les sensations de la Clio de compétition avec notre pilote lors de cette animation spéciale midi.', 1);

SELECT id INTO v_bapteme_id    FROM activities WHERE name = 'bapteme';
SELECT id INTO v_conduite_id   FROM activities WHERE name = 'conduite';
SELECT id INTO v_carbooling_id FROM activities WHERE name = 'carbooling';

-- ============================================================
-- 2. Génération des créneaux BAPTÊME DRIFT
-- 3 voitures, 5 passagers, 7 min/cycle (5min session + 2min rotation)
-- Pause 15 min à chaque heure pile (HH:00 -> HH:15)
-- Matin : 09:00 -> dernier départ 11:45
-- Après-midi : 13:00 -> dernier départ 16:25
-- ============================================================

FOR v_day IN SELECT unnest(ARRAY[v_saturday, v_sunday]) LOOP
  -- Matin
  v_current := '09:00';
  WHILE v_current <= '11:45' LOOP
    -- Vérifier si c'est une heure pile -> pause 15 min
    IF extract(minute FROM v_current) = 0 AND v_current != '09:00' THEN
      -- Insérer la pause visuelle
      INSERT INTO slots (activity_id, day, start_time, end_time, capacity, is_break)
      VALUES (v_bapteme_id, v_day, v_current, v_current + interval '15 minutes', 0, true);
      v_current := v_current + interval '15 minutes';
    END IF;

    IF v_current > '11:45' THEN EXIT; END IF;

    v_end := v_current + interval '7 minutes';
    INSERT INTO slots (activity_id, day, start_time, end_time, capacity, is_break)
    VALUES (v_bapteme_id, v_day, v_current, v_end, 5, false);
    v_current := v_end;

    -- Pause à l'heure pile (re-check après ajout)
    IF extract(minute FROM v_current) = 0 AND v_current <= '11:45' THEN
      INSERT INTO slots (activity_id, day, start_time, end_time, capacity, is_break)
      VALUES (v_bapteme_id, v_day, v_current, v_current + interval '15 minutes', 0, true);
      v_current := v_current + interval '15 minutes';
    END IF;
  END LOOP;

  -- Après-midi
  v_current := '13:00';
  WHILE v_current <= '16:25' LOOP
    IF extract(minute FROM v_current) = 0 AND v_current != '13:00' THEN
      INSERT INTO slots (activity_id, day, start_time, end_time, capacity, is_break)
      VALUES (v_bapteme_id, v_day, v_current, v_current + interval '15 minutes', 0, true);
      v_current := v_current + interval '15 minutes';
    END IF;

    IF v_current > '16:25' THEN EXIT; END IF;

    v_end := v_current + interval '7 minutes';
    INSERT INTO slots (activity_id, day, start_time, end_time, capacity, is_break)
    VALUES (v_bapteme_id, v_day, v_current, v_end, 5, false);
    v_current := v_end;

    IF extract(minute FROM v_current) = 0 AND v_current <= '16:25' THEN
      INSERT INTO slots (activity_id, day, start_time, end_time, capacity, is_break)
      VALUES (v_bapteme_id, v_day, v_current, v_current + interval '15 minutes', 0, true);
      v_current := v_current + interval '15 minutes';
    END IF;
  END LOOP;
END LOOP;

-- ============================================================
-- 3. Génération des créneaux SESSION CONDUITE
-- 2 voitures, 1 pilote, 6 min, rotation continue, pas de pause
-- Matin : 09:00 -> dernier départ 11:54
-- Après-midi : 13:00 -> dernier départ 16:24
-- ============================================================

FOR v_day IN SELECT unnest(ARRAY[v_saturday, v_sunday]) LOOP
  -- Matin
  v_current := '09:00';
  WHILE v_current <= '11:54' LOOP
    v_end := v_current + interval '6 minutes';
    INSERT INTO slots (activity_id, day, start_time, end_time, capacity, is_break)
    VALUES (v_conduite_id, v_day, v_current, v_end, 1, false);
    v_current := v_end;
  END LOOP;

  -- Après-midi
  v_current := '13:00';
  WHILE v_current <= '16:24' LOOP
    v_end := v_current + interval '6 minutes';
    INSERT INTO slots (activity_id, day, start_time, end_time, capacity, is_break)
    VALUES (v_conduite_id, v_day, v_current, v_end, 1, false);
    v_current := v_end;
  END LOOP;
END LOOP;

-- ============================================================
-- 4. Génération des créneaux CAR BOOLING CLIO
-- 4 min/passage, 12:00 -> 12:56 (15 passages)
-- ============================================================

FOR v_day IN SELECT unnest(ARRAY[v_saturday, v_sunday]) LOOP
  v_current := '12:00';
  WHILE v_current <= '12:56' LOOP
    v_end := v_current + interval '4 minutes';
    INSERT INTO slots (activity_id, day, start_time, end_time, capacity, is_break)
    VALUES (v_carbooling_id, v_day, v_current, v_end, 1, false);
    v_current := v_end;
  END LOOP;
END LOOP;

-- ============================================================
-- 5. Compte admin par défaut (Supabase Auth)
-- ============================================================

INSERT INTO admin_users (email, name, role)
VALUES ('maxence.fortier@gmail.com', 'Maxence', 'admin')
ON CONFLICT (email) DO NOTHING;

RAISE NOTICE 'Seed terminé. Slots baptême: %, conduite: %, carbooling: %',
  (SELECT COUNT(*) FROM slots WHERE activity_id = v_bapteme_id AND NOT is_break),
  (SELECT COUNT(*) FROM slots WHERE activity_id = v_conduite_id),
  (SELECT COUNT(*) FROM slots WHERE activity_id = v_carbooling_id);

END $$;
