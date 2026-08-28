-- ============================================================
-- Devi Youth Sree Bala Ganesh Puja — optional seed data
-- Mirrors src/data/sampleData.js so you can see the live-data path
-- working end to end before real committee data is entered.
-- Run AFTER 01_schema.sql, 02_policies.sql and 03_storage.sql,
-- using the Supabase SQL editor (runs as postgres, bypasses RLS).
-- ============================================================

insert into festivals (year, name_en, name_te, village_en, village_te, start_date, end_date, public_donation_total, is_active)
values (2026, 'Ganesh Chaturthi', 'గణేష్ చతుర్థి', 'Our Village', 'మన గ్రామం', '2026-09-14', '2026-09-24', '₹8,50,000', true)
on conflict (year) do nothing;

do $$
declare
  fid uuid;
  lid uuid;
begin
  select id into fid from festivals where year = 2026;

  insert into announcements (festival_id, title_en, title_te, body_en, body_te, important, published_at)
  values
    (fid, 'Tomorrow''s Annadanam at 12:30 PM', 'రేపు మధ్యాహ్నం 12:30కి అన్నదానం',
     'Annadanam will begin at 12:30 PM near the temple. Everyone from the village is welcome.',
     'అన్నదానం ఆలయం సమీపంలో మధ్యాహ్నం 12:30కి ప్రారంభమవుతుంది. గ్రామస్తులందరూ ఆహ్వానితులే.',
     true, '2026-09-13T09:00:00Z'),
    (fid, 'Cultural program registrations open', 'సాంస్కృతిక కార్యక్రమ నమోదులు ప్రారంభం',
     'Children and youth interested in performing can register with the committee by Friday.',
     'ప్రదర్శన ఇవ్వాలనుకునే పిల్లలు, యువత శుక్రవారంలోగా కమిటీ వద్ద నమోదు చేసుకోవచ్చు.',
     false, '2026-09-12T09:00:00Z');

  insert into events (festival_id, title_en, title_te, description_en, description_te, location_en, location_te, event_date, event_time, sort_order)
  values
    (fid, 'Idol Prathishta (Installation)', 'ప్రతిష్ఠ (విగ్రహ ప్రతిష్ఠాపన)',
     'Ceremonial installation of the Ganesh idol with Vedic rites.', 'వేద మంత్రోచ్ఛారణలతో గణేష్ విగ్రహ ప్రతిష్ఠాపన.',
     'Village Temple Mandapam', 'గ్రామ ఆలయ మండపం', '2026-09-14', '9:00 AM', 1),
    (fid, 'Cultural Program', 'సాంస్కృతిక కార్యక్రమం',
     'Dance and music performances by village children.', 'గ్రామ పిల్లల నృత్య, సంగీత ప్రదర్శనలు.',
     'Community Grounds', 'కమ్యూనిటీ మైదానం', '2026-09-16', '6:30 PM', 2),
    (fid, 'Annadanam', 'అన్నదానం',
     'Community lunch offered to all visitors.', 'సందర్శకులందరికీ సామూహిక భోజన సేవ.',
     'Temple Courtyard', 'ఆలయ ప్రాంగణం', '2026-09-20', '12:30 PM', 3),
    (fid, 'Immersion Procession', 'నిమజ్జన ఊరేగింపు',
     'Grand procession concluding at the village tank.', 'గ్రామ చెరువు వద్ద ముగిసే గొప్ప ఊరేగింపు.',
     'Temple to Village Tank', 'ఆలయం నుండి గ్రామ చెరువు వరకు', '2026-09-24', '4:00 PM', 4);

  insert into committee_members (festival_id, name, position_en, position_te, phone, sort_order)
  values
    (fid, 'K. Venkata Rao', 'President', 'అధ్యక్షుడు', '+919000000001', 1),
    (fid, 'S. Lakshmi Devi', 'Secretary', 'కార్యదర్శి', '+919000000002', 2),
    (fid, 'M. Ramesh', 'Treasurer', 'కోశాధికారి', '+919000000003', 3),
    (fid, 'P. Anitha', 'Cultural Coordinator', 'సాంస్కృతిక సమన్వయకర్త', '+919000000004', 4);

  insert into laddu_auctions (festival_id, title_en, title_te, starting_price, auction_date, auction_time, location_en, location_te)
  values (fid, 'Grand Laddu 2026', 'గ్రాండ్ లడ్డు 2026', '₹21,000', '2026-09-22', '7:00 PM', 'Temple Mandapam', 'ఆలయ మండపం');

  insert into lottery (festival_id, draw_date, draw_time, location_en, location_te)
  values (fid, '2026-09-23', '6:00 PM', 'Community Grounds', 'కమ్యూనిటీ మైదానం')
  returning id into lid;

  insert into lottery_prizes (lottery_id, name_en, name_te, value, sort_order)
  values
    (lid, 'First Prize — Two-Wheeler', 'ప్రథమ బహుమతి — ద్విచక్ర వాహనం', '₹85,000', 1),
    (lid, 'Second Prize — Gold Coin', 'ద్వితీయ బహుమతి — బంగారు నాణెం', '₹15,000', 2),
    (lid, 'Third Prize — Mixer Grinder', 'తృతీయ బహుమతి — మిక్సర్ గ్రైండర్', '₹4,500', 3),
    (lid, 'Fourth Prize — Steel Cookware Set', 'నాలుగవ బహుమతి — స్టీల్ వంటపాత్రల సెట్', '₹2,500', 4);

  insert into photo_albums (festival_id, name_en, sort_order)
  values
    (fid, 'Prathishta', 1),
    (fid, 'Cultural Program', 2),
    (fid, 'Annadanam', 3),
    (fid, 'Procession', 4);

  insert into contacts (name, role_en, role_te, phone, sort_order)
  values
    ('K. Venkata Rao', 'Committee President', 'కమిటీ అధ్యక్షుడు', '+919000000001', 1),
    ('S. Lakshmi Devi', 'Committee Secretary', 'కమిటీ కార్యదర్శి', '+919000000002', 2),
    ('Village Temple Office', 'Temple Office', 'ఆలయ కార్యాలయం', '+919000000005', 3),
    ('Local Police Station', 'Emergency', 'అత్యవసర సేవలు', '100', 4);
end $$;

-- A previous year, so Gallery/History year filters have more than one tab.
insert into festivals (year, name_en, name_te, village_en, village_te, start_date, end_date, public_donation_total, is_active)
values (2025, 'Ganesh Chaturthi', 'గణేష్ చతుర్థి', 'Our Village', 'మన గ్రామం', '2025-09-05', '2025-09-15', '₹7,20,000', false)
on conflict (year) do nothing;
