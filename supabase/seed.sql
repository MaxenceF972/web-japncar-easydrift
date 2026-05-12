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
  (uuid_generate_v4(), 'bapteme',    'Baptême EASYDRIFT',    4000, 7,  '#F47B20', 'Montez à bord d''une voiture EASYDRIFT pilotée par un professionnel et vivez la sensation unique de la dérive !', 5),
  (uuid_generate_v4(), 'conduite',   'Session Conduite',     5000, 6,  '#E67E22', 'Prenez le volant et pilotez vous-même avec nos enveloppes EASYDRIFT sur un petit circuit sous la supervision de nos instructeurs.', 1),
  (uuid_generate_v4(), 'carbooling', 'Car Booling',     2000, 6,  '#8E44AD', 'Découvrez les sensations d''un Car Booling lors de cette animation spéciale midi.', 1);

SELECT id INTO v_bapteme_id    FROM activities WHERE name = 'bapteme';
SELECT id INTO v_conduite_id   FROM activities WHERE name = 'conduite';
SELECT id INTO v_carbooling_id FROM activities WHERE name = 'carbooling';

-- ============================================================
-- 2. Génération des créneaux BAPTÊME DRIFT
-- 3 voitures, 5 passagers, 5 min session + 2 min rotation = 7 min/cycle
-- Pauses calées sur le planning (après ~9 sessions)
-- Matin : 20 sessions (09:00 → 11:41) — Après-midi : 24 sessions (13:00 → 16:20)
-- ============================================================

FOR v_day IN SELECT unnest(ARRAY[v_saturday, v_sunday]) LOOP

  -- MATIN — Groupe 1 : 9 sessions
  v_current := '09:00';
  WHILE v_current <= '09:56' LOOP
    INSERT INTO slots (activity_id, day, start_time, end_time, capacity, is_break)
    VALUES (v_bapteme_id, v_day, v_current, v_current + interval '5 min', 5, false);
    v_current := v_current + interval '7 min';
  END LOOP;
  INSERT INTO slots (activity_id, day, start_time, end_time, capacity, is_break)
  VALUES (v_bapteme_id, v_day, '10:01', '10:15', 0, true);

  -- MATIN — Groupe 2 : 7 sessions
  v_current := '10:15';
  WHILE v_current <= '10:57' LOOP
    INSERT INTO slots (activity_id, day, start_time, end_time, capacity, is_break)
    VALUES (v_bapteme_id, v_day, v_current, v_current + interval '5 min', 5, false);
    v_current := v_current + interval '7 min';
  END LOOP;
  INSERT INTO slots (activity_id, day, start_time, end_time, capacity, is_break)
  VALUES (v_bapteme_id, v_day, '11:02', '11:15', 0, true);

  -- MATIN — Groupe 3 : 4 sessions
  v_current := '11:15';
  WHILE v_current <= '11:36' LOOP
    INSERT INTO slots (activity_id, day, start_time, end_time, capacity, is_break)
    VALUES (v_bapteme_id, v_day, v_current, v_current + interval '5 min', 5, false);
    v_current := v_current + interval '7 min';
  END LOOP;

  -- APRÈS-MIDI — Groupe 1 : 9 sessions
  v_current := '13:00';
  WHILE v_current <= '13:56' LOOP
    INSERT INTO slots (activity_id, day, start_time, end_time, capacity, is_break)
    VALUES (v_bapteme_id, v_day, v_current, v_current + interval '5 min', 5, false);
    v_current := v_current + interval '7 min';
  END LOOP;
  INSERT INTO slots (activity_id, day, start_time, end_time, capacity, is_break)
  VALUES (v_bapteme_id, v_day, '14:01', '14:15', 0, true);

  -- APRÈS-MIDI — Groupe 2 : 7 sessions
  v_current := '14:15';
  WHILE v_current <= '14:57' LOOP
    INSERT INTO slots (activity_id, day, start_time, end_time, capacity, is_break)
    VALUES (v_bapteme_id, v_day, v_current, v_current + interval '5 min', 5, false);
    v_current := v_current + interval '7 min';
  END LOOP;
  INSERT INTO slots (activity_id, day, start_time, end_time, capacity, is_break)
  VALUES (v_bapteme_id, v_day, '15:02', '15:15', 0, true);

  -- APRÈS-MIDI — Groupe 3 : 7 sessions
  v_current := '15:15';
  WHILE v_current <= '15:57' LOOP
    INSERT INTO slots (activity_id, day, start_time, end_time, capacity, is_break)
    VALUES (v_bapteme_id, v_day, v_current, v_current + interval '5 min', 5, false);
    v_current := v_current + interval '7 min';
  END LOOP;
  INSERT INTO slots (activity_id, day, start_time, end_time, capacity, is_break)
  VALUES (v_bapteme_id, v_day, '16:02', '16:15', 0, true);

  -- APRÈS-MIDI — Groupe 4 : 1 session
  INSERT INTO slots (activity_id, day, start_time, end_time, capacity, is_break)
  VALUES (v_bapteme_id, v_day, '16:15', '16:20', 5, false);

END LOOP;

-- ============================================================
-- 3. Génération des créneaux SESSION CONDUITE
-- 2 voitures, 1 pilote, 6 min, rotation continue, pas de pause
-- Matin : 27 passages (09:00 → 11:42) — Après-midi : 34 passages (13:00 → 16:24)
-- ============================================================

FOR v_day IN SELECT unnest(ARRAY[v_saturday, v_sunday]) LOOP
  -- Matin (27 passages)
  v_current := '09:00';
  WHILE v_current < '11:42' LOOP
    INSERT INTO slots (activity_id, day, start_time, end_time, capacity, is_break)
    VALUES (v_conduite_id, v_day, v_current, v_current + interval '6 min', 1, false);
    v_current := v_current + interval '6 min';
  END LOOP;

  -- Après-midi (34 passages)
  v_current := '13:00';
  WHILE v_current < '16:24' LOOP
    INSERT INTO slots (activity_id, day, start_time, end_time, capacity, is_break)
    VALUES (v_conduite_id, v_day, v_current, v_current + interval '6 min', 1, false);
    v_current := v_current + interval '6 min';
  END LOOP;
END LOOP;

-- ============================================================
-- 4. Génération des créneaux CAR BOOLING CLIO
-- 6 min/passage, 13:00 -> 14:00 (10 passages)
-- ============================================================

FOR v_day IN SELECT unnest(ARRAY[v_saturday, v_sunday]) LOOP
  v_current := '13:00';
  WHILE v_current < '14:00' LOOP
    v_end := v_current + interval '6 minutes';
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
