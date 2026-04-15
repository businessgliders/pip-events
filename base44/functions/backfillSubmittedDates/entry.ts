import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// CSV submitted dates mapped by email + fullName (trimmed lowercase key)
const CSV_DATA = [
  { fullName: 'Farah Sharieff', email: 'farahsharieff15@gmail.com', submittedDate: '2025-10-10T19:55:50.509Z', eventDate: '2025-12-13' },
  { fullName: 'Puvneet sahi', email: 'sahipuvneet@gmail.com', submittedDate: '2025-10-10T20:35:44.906Z', eventDate: '2026-02-07' },
  { fullName: 'Amina Mudie', email: 'aminamudie97@gmail.com', submittedDate: '2025-10-10T22:04:37.170Z', eventDate: '2025-11-29' },
  { fullName: 'Nishani baskar', email: 'nbask035@uottawa.ca', submittedDate: '2025-10-11T05:29:36.470Z', eventDate: '2025-12-13' },
  { fullName: 'Elizabeth Goodwin', email: 'elizabethrobinson@gmail.com', submittedDate: '2025-10-13T12:20:16.521Z', eventDate: '2025-11-22' },
  { fullName: 'Selena', email: 'selenaisatchell@gmail.com', submittedDate: '2025-10-14T23:47:34.281Z', eventDate: '2025-11-16' },
  { fullName: 'Tia choudhry', email: 'tiachoudhry1987@hotmail.com', submittedDate: '2025-10-15T16:24:41.424Z', eventDate: '2025-11-07' },
  { fullName: 'Laura Martinez', email: 'lauramartinez2313@gmail.com', submittedDate: '2025-10-15T17:32:17.791Z', eventDate: '2025-11-23' },
  { fullName: 'Carletta santokie', email: 'carlettasantokie02@outlook.com', submittedDate: '2025-10-15T18:14:28.819Z', eventDate: '2025-11-01' },
  { fullName: 'Monique Pitt', email: 'gyallivant@gmail.com', submittedDate: '2025-10-18T14:19:23.506Z', eventDate: '2025-10-31' },
  { fullName: 'kim Nicho', email: 'kimnicho178@gmail.com', submittedDate: '2025-10-18T19:36:04.862Z', eventDate: '2025-11-01' },
  { fullName: 'Sanchi Vadehra', email: 'sanchivadehra@yahoo.com', submittedDate: '2025-10-18T22:10:47.711Z', eventDate: '2025-12-07' },
  { fullName: 'Carletta S', email: 'carlettasantokie02@outlook.com', submittedDate: '2025-10-18T23:11:12.432Z', eventDate: '2025-11-08' },
  { fullName: 'Saya Azizova', email: 'sayxhat255@hotmail.com', submittedDate: '2025-10-20T03:16:55.531Z', eventDate: '2026-02-21' },
  { fullName: 'Jennifer Okyere', email: 'info@eliteauracollective.com', submittedDate: '2025-10-21T00:45:32.092Z', eventDate: '2026-03-28' },
  { fullName: 'Oluwafikunmi Esther Olatunji', email: 'oluwafikunmi.esther@torontomu.ca', submittedDate: '2025-10-22T21:33:28.214Z', eventDate: '2025-10-29' },
  { fullName: 'Sieanna Pott', email: 'siemerun2@gmail.com', submittedDate: '2025-10-29T01:45:44.010Z', eventDate: '2025-11-22' },
  { fullName: 'Audny-Cashae Stewart', email: 'audnystewart39@gmail.com', submittedDate: '2025-10-29T03:24:58.708Z', eventDate: '2025-12-14' },
  { fullName: 'Khushreen Kahlon', email: 'khushreenkahlon@hotmail.com', submittedDate: '2025-10-29T13:54:47.969Z', eventDate: '2025-11-07' },
  { fullName: 'Abigail Angad', email: 'abigailb.angad@hotmail.com', submittedDate: '2025-10-29T15:33:23.242Z', eventDate: '2026-01-15' },
  { fullName: 'Brianna lyle', email: 'briannacola485@gmail.com', submittedDate: '2025-10-29T15:52:59.620Z', eventDate: '2025-12-06' },
  { fullName: 'Rochel Mohabir', email: 'rochelmohabir@hotmail.com', submittedDate: '2025-10-29T17:28:50.949Z', eventDate: '2025-12-14' },
  { fullName: 'Mbewa Kaisi', email: 'amisahkaisi@gmail.com', submittedDate: '2025-10-29T21:47:09.666Z', eventDate: '2026-01-10' },
  { fullName: 'Noor Brar', email: 'Jagnoorbrar31@gmail.com', submittedDate: '2025-10-30T01:53:45.300Z', eventDate: '2025-11-15' },
  { fullName: 'Brianna Adu', email: 'briannaadu1@gmail.com', submittedDate: '2025-10-31T17:57:03.569Z', eventDate: '2025-11-29' },
  { fullName: 'Blessing Senkyire', email: 'blessingsenky@icloud.com', submittedDate: '2025-10-31T20:35:27.754Z', eventDate: '2025-11-30' },
  { fullName: 'marwa alissa', email: 'm97639493@gmail.com', submittedDate: '2025-11-01T03:11:21.899Z', eventDate: '2025-12-05' },
  { fullName: 'Prerna Gupta', email: 'prernagupta479@gmail.com', submittedDate: '2025-11-01T23:44:57.667Z', eventDate: '2026-01-11' },
  { fullName: 'Diana', email: 'dianastepasuk8@gmail.com', submittedDate: '2025-11-02T17:21:12.052Z', eventDate: '2025-11-19' },
  { fullName: 'Shiloh', email: 'shilohhalley@hotmail.com', submittedDate: '2025-11-04T16:20:19.662Z', eventDate: '2025-12-13' },
  { fullName: 'Kirnpreet Sahota', email: 'kirnpreet_10@outlook.com', submittedDate: '2025-11-05T20:35:08.170Z', eventDate: '2025-11-29' },
  { fullName: 'Jahneil Manning', email: 'jahneilmanning@yahoo.ca', submittedDate: '2025-11-06T08:45:06.385Z', eventDate: '2025-11-22' },
  { fullName: 'Diana Ossowski', email: 'dvossowski@gmail.com', submittedDate: '2025-11-06T18:55:35.595Z', eventDate: '2026-04-18' },
  { fullName: 'Harman Grewal', email: 'harmang96@hotmail.com', submittedDate: '2025-11-07T16:30:46.433Z', eventDate: '2026-01-31' },
  { fullName: 'Rahavi Sureshkumar', email: 'rahavi-suresh@hotmail.com', submittedDate: '2025-11-08T16:50:12.215Z', eventDate: '2025-11-22', preferredTimes: '2pm' },
  { fullName: 'Rahavi Sureshkumar', email: 'rahavi-suresh@hotmail.com', submittedDate: '2025-11-09T14:17:20.736Z', eventDate: '2025-11-22', preferredTimes: '5pm' },
  { fullName: 'Prama Bhattacharjee', email: 'pramab1122@gmail.com', submittedDate: '2025-11-09T21:08:35.654Z', eventDate: '2025-11-22' },
  { fullName: 'Kimberly Prasad', email: 'kimberly_prasad@hotmail.com', submittedDate: '2025-11-10T21:08:56.265Z', eventDate: '2025-12-07' },
  { fullName: 'Kanishka Dalwadi', email: 'dalwadik88@gmail.com', submittedDate: '2025-11-12T14:53:29.203Z', eventDate: '2026-01-10' },
  { fullName: 'Gurpreen', email: 'gurpreenss@gmail.com', submittedDate: '2025-11-14T13:55:38.599Z', eventDate: '2026-01-21' },
  { fullName: 'Rashmeen', email: 'rashsab@hotmail.com', submittedDate: '2025-11-14T15:28:38.386Z', eventDate: '2026-01-21' },
  { fullName: 'Alyssa Stellato', email: 'info@alyssastellato.com', submittedDate: '2025-11-18T20:16:01.667Z', eventDate: '2026-02-08' },
  { fullName: 'shirhan', email: 'shirhan12@icloud.com', submittedDate: '2025-11-19T09:51:24.779Z', eventDate: '2025-11-30' },
  { fullName: 'Malina Nankoo', email: 'malina.nankoo@gmail.com', submittedDate: '2025-11-19T17:47:45.248Z', eventDate: '2025-12-19' },
  { fullName: 'aleeze siddique', email: 'asiddique@apexpr.com', submittedDate: '2025-11-20T16:09:00.603Z', eventDate: '2026-05-10' },
  { fullName: 'Maiya Frias', email: 'maiyafrias@icloud.com', submittedDate: '2025-11-24T18:28:02.478Z', eventDate: '2025-12-20' },
  { fullName: 'Sunnena Virdi', email: 'sunnena.v@gmail.com', submittedDate: '2025-11-26T17:46:13.515Z', eventDate: '2025-12-20' },
  { fullName: 'Natalie Dayle', email: 'nadayle@hotmail.com', submittedDate: '2025-11-27T07:29:52.483Z', eventDate: '2026-01-11' },
  { fullName: 'Alee Hemm', email: 'sexilicia2008@hotmail.com', submittedDate: '2025-11-27T14:05:51.028Z', eventDate: '2025-12-14' },
  { fullName: 'Sandy Brathwaite', email: 'sandytbrathwaite0@gmail.com', submittedDate: '2025-11-27T20:50:24.719Z', eventDate: '2026-01-05' },
  { fullName: 'emily ouimet', email: 'emilyouimet1@gmail.com', submittedDate: '2025-11-29T01:46:49.279Z', eventDate: '2025-12-14' },
  { fullName: 'Jasmine', email: 'jasminemeshia@gmail.com', submittedDate: '2025-11-30T02:26:06.817Z', eventDate: '2026-03-29' },
  { fullName: 'Kiyana Galvan-Reyes', email: 'k.kiyanagalvan@gmail.com', submittedDate: '2025-12-02T15:08:27.148Z', eventDate: '2025-12-29' },
  { fullName: 'Hibo Aden', email: 'hiboaden18@gmail.com', submittedDate: '2025-12-02T20:43:21.538Z', eventDate: '2025-12-14' },
  { fullName: 'Shanell R', email: 'shanell_ridgwell@hotmail.com', submittedDate: '2025-12-08T04:13:09.910Z', eventDate: '2026-01-10' },
  { fullName: 'Amanpreet Somal', email: 'amanpreetsomal@hotmail.co.uk', submittedDate: '2025-12-14T03:17:01.137Z', eventDate: '2026-02-07' },
  { fullName: 'Jaskiran Sohal', email: 'jaskirangrewal@outlook.com', submittedDate: '2025-12-15T14:33:55.313Z', eventDate: '2026-01-25' },
  { fullName: 'Kayla Kifumbi', email: 'kaylakifumbi@gmail.com', submittedDate: '2025-12-15T23:16:49.804Z', eventDate: '2026-04-05' },
  { fullName: 'Edith Agyeman', email: 'edithaaee@hotmail.com', submittedDate: '2025-12-16T19:11:21.339Z', eventDate: '2026-02-01' },
  { fullName: 'Tianna Whych', email: 'tiannawhych1990@icloud.com', submittedDate: '2025-12-20T06:30:05.700Z', eventDate: '2025-12-28' },
  { fullName: 'Jasmine Liew', email: 'jasmin3_s2@hotmail.com', submittedDate: '2025-12-20T22:43:56.134Z', eventDate: '2026-01-24' },
  { fullName: 'Josybeth Yousef', email: 'josybethyousef@hotmail.com', submittedDate: '2025-12-21T06:34:45.122Z', eventDate: '2026-01-04' },
  { fullName: 'Salina Alves', email: 'salina.alves00@gmail.com', submittedDate: '2025-12-22T23:38:30.059Z', eventDate: '2026-01-14' },
  { fullName: 'Luxshanaa Suthersanan', email: 'luxshanaa101@hotmail.ca', submittedDate: '2025-12-24T15:22:57.860Z', eventDate: '2026-02-01' },
  { fullName: 'Keiosha Sparks', email: 'keioshasparks@gmail.com', submittedDate: '2025-12-26T14:07:18.701Z', eventDate: '2026-01-31' },
  { fullName: 'Shauna Harris-williams', email: 'shaunapatricah@gmail.com', submittedDate: '2025-12-27T03:56:16.897Z', eventDate: '2026-03-28' },
  { fullName: 'La Phillips', email: 'lashaneapg@yahoo.com', submittedDate: '2025-12-27T16:40:43.571Z', eventDate: '2026-03-29' },
  { fullName: 'Simran', email: 's4johal@gmail.com', submittedDate: '2025-12-30T19:51:07.125Z', eventDate: '2026-01-24' },
  { fullName: 'Harnit Dhesi', email: 'harnit13@hotmail.com', submittedDate: '2026-01-03T18:08:25.377Z', eventDate: '2026-05-30' },
  { fullName: 'Isabella Bastasin', email: 'bella.b211@outlook.com', submittedDate: '2026-01-06T03:13:11.332Z', eventDate: '2026-01-10' },
  { fullName: 'Bianca Landicho', email: 'biancalandicho00@hotmail.com', submittedDate: '2026-01-07T01:29:02.514Z', eventDate: '2026-04-04' },
  { fullName: 'Jennifer Soares', email: 'jsoares04@hotmail.ca', submittedDate: '2026-01-07T04:08:18.182Z', eventDate: '2026-04-12' },
  { fullName: 'Amrit Dhadialla', email: 'amritdhadialla@gmail.com', submittedDate: '2026-01-08T17:40:36.551Z', eventDate: '2026-01-30' },
  { fullName: 'Donnette Hewitt', email: 'donnettehewitt22@gmail.com', submittedDate: '2026-01-08T19:32:45.888Z', eventDate: '2026-09-06' },
  { fullName: 'Tiana Gordon', email: 'tiana.k.gordon@gmail.com', submittedDate: '2026-01-09T12:01:31.621Z', eventDate: '2026-02-28', notes: '3:00pm or afternoon' },
  { fullName: 'Tameka M', email: 'tamssm@icloud.com', submittedDate: '2026-01-09T22:56:10.023Z', eventDate: '2026-01-24' },
  { fullName: 'Zainab Kanuga', email: 'zainabkanuga@gmail.com', submittedDate: '2026-01-10T01:38:38.374Z', eventDate: '2026-05-17' },
  { fullName: 'Tee Yung', email: 'teeyung.map@gmail.com', submittedDate: '2026-01-10T02:19:44.166Z', eventDate: '2026-02-12' },
  { fullName: 'Dominique Jackson', email: 'domojaee@gmail.com', submittedDate: '2026-01-10T19:28:42.883Z', eventDate: '2026-03-21' },
  { fullName: 'Chloe shako', email: 'shakochloe@gmail.com', submittedDate: '2026-01-10T20:13:31.076Z', eventDate: '2026-01-31' },
  { fullName: 'Elyse Henry-Xymines', email: 'e.henryxyminies@gmail.com', submittedDate: '2026-01-10T22:13:23.878Z', eventDate: '2026-01-30' },
  { fullName: 'Julia g', email: 'julia.s.gervasi@hotmail.com', submittedDate: '2026-01-10T23:07:23.300Z', eventDate: '2026-05-03' },
  { fullName: 'Hannaa Nasraoui', email: 'hannaa.nasraoui@gmail.com', submittedDate: '2026-01-11T03:24:56.622Z', eventDate: '2026-03-01' },
  { fullName: 'Bianca Landicho', email: 'biancalandicho00@hotmail.com', submittedDate: '2026-01-11T07:18:44.321Z', eventDate: '2026-04-05' },
  { fullName: 'Antonia Taylor', email: 'aetaylorjobs@gmail.com', submittedDate: '2026-01-11T18:26:47.903Z', eventDate: '2026-03-14' },
  { fullName: 'Emmanuella Dadzie', email: 'ekdadzie119@gmail.com', submittedDate: '2026-01-11T20:31:08.152Z', eventDate: '2026-01-19' },
  { fullName: 'Latoya Kurtis', email: 'lakxo24@gmail.com', submittedDate: '2026-01-12T00:03:48.209Z', eventDate: '2026-02-04' },
  { fullName: 'Aaliyah Lawrence', email: 'aaliyahlawrence788@gmail.com', submittedDate: '2026-01-12T18:01:34.096Z', eventDate: '2026-02-25', notes: '18 guests' },
  { fullName: 'Neetu', email: 'dhur.neetu1@gmail.com', submittedDate: '2026-01-16T13:28:06.819Z', eventDate: '2026-03-14' },
  { fullName: 'Anisha Persaud', email: 'anishaapersaud@gmail.com', submittedDate: '2026-01-16T20:46:10.750Z', eventDate: '2026-02-21' },
  { fullName: 'Nav Khatra', email: 'nawjotkhatra@gmail.com', submittedDate: '2026-01-17T03:23:53.211Z', eventDate: '2026-02-21' },
  { fullName: 'Talynn DeBartolo', email: 'talynndebartolo@gmail.com', submittedDate: '2026-01-17T15:13:03.624Z', eventDate: '2026-02-20' },
  { fullName: 'Abigail Panilan-Yan', email: 'abigailpyan@yahoo.ca', submittedDate: '2026-01-17T16:45:16.850Z', eventDate: '2026-06-27' },
  { fullName: 'Crystal Gonzalez', email: 'crystalgonza03@gmail.com', submittedDate: '2026-01-18T05:20:03.383Z', eventDate: '2026-03-21' },
  { fullName: 'Simran Dosanjh', email: 'simran.dosanjh25@gmail.com', submittedDate: '2026-01-20T15:54:00.911Z', eventDate: '2026-02-01' },
  { fullName: 'Nawaal Mohamed', email: 'nawaalmohamed@gmail.com', submittedDate: '2026-01-20T21:54:54.609Z', eventDate: '2026-02-07' },
  { fullName: 'Carla', email: 'carlakatcreates@gmail.com', submittedDate: '2026-01-21T02:41:26.559Z', eventDate: '2026-03-08' },
  { fullName: 'Shaylene Bailey', email: 'shayleneb29@gmail.com', submittedDate: '2026-01-22T03:07:01.369Z', eventDate: '2026-01-31' },
  { fullName: 'Shaylene Bailey', email: 'shaylendb29@gmail.com', submittedDate: '2026-01-22T03:08:10.915Z', eventDate: '2026-02-01' },
  { fullName: 'Gurleen Kaur', email: 'gurleenjuhi6@gmail.com', submittedDate: '2026-01-23T04:47:29.526Z', eventDate: '2026-05-23' },
  { fullName: 'Yuniqua Johnson', email: 'yuniquajohnson@gmail.com', submittedDate: '2026-01-24T16:54:58.725Z', eventDate: '2026-04-18' },
  { fullName: 'Neha Somani', email: 'nehasomani438@gmail.com', submittedDate: '2026-01-24T19:26:25.402Z', eventDate: '2026-02-28' },
  { fullName: 'Valki Romero', email: 'valkiriaromero2003@gmail.com', submittedDate: '2026-01-25T19:22:13.643Z', eventDate: '2026-02-22' },
  { fullName: 'Hannah Rose', email: 'hannahigor1d@gmail.com', submittedDate: '2026-01-28T02:52:03.563Z', eventDate: '2026-04-19' },
  { fullName: 'Sarieaka Joseph', email: 'sarieakaj@gmail.com', submittedDate: '2026-01-28T19:43:01.503Z', eventDate: '2026-04-11' },
  { fullName: 'Harleen  Sohi', email: 'harleensohi103@gmail.com', submittedDate: '2026-01-30T00:25:08.044Z', eventDate: '2026-02-21' },
  { fullName: 'Aaliyah Lawrence', email: 'aaliyahlawrence788@gmail.com', submittedDate: '2026-01-31T22:47:01.966Z', eventDate: '2026-02-25', notes: '9 guests' },
  { fullName: 'Couresa D', email: 'couresadacosta@gmail.com', submittedDate: '2026-02-01T15:59:29.924Z', eventDate: '2026-08-16' },
  { fullName: 'varinder Dhaliwal', email: 'bindadhaliwal252@gmail.com', submittedDate: '2026-02-01T18:53:10.206Z', eventDate: '2026-02-28' },
  { fullName: 'Kaitlyn Munroe', email: 'kaitmunroe@outlook.com', submittedDate: '2026-02-01T23:34:33.676Z', eventDate: '2026-03-07' },
  { fullName: 'Muniira mohamed', email: 'missniralove@gmail.com', submittedDate: '2026-02-02T06:27:25.661Z', eventDate: '2026-03-29' },
  { fullName: 'Iris', email: 'irisvillatoro1@hotmail.com', submittedDate: '2026-02-02T19:18:27.887Z', eventDate: '2026-02-15' },
  { fullName: 'Annesha Bhowmik', email: 'anneshabhowmik5@gmail.com', submittedDate: '2026-02-03T16:18:29.783Z', eventDate: '2026-04-04' },
  { fullName: 'Kabryna Robb', email: 'k.bryna@icloud.com', submittedDate: '2026-02-03T19:58:17.833Z', eventDate: '2026-04-25' },
  { fullName: 'Tiana Gordon', email: 'tiana.k.gordon@gmail.com', submittedDate: '2026-02-03T23:51:18.789Z', eventDate: '2026-02-28', notes: '1:30pm' },
  { fullName: 'Ayaan jama', email: 'ajaay.jama@gmail.com', submittedDate: '2026-02-05T18:31:44.233Z', eventDate: '2026-04-06' },
  { fullName: 'Daniella', email: 'daniella.kennedy34@icloud.com', submittedDate: '2026-02-08T21:16:37.585Z', eventDate: '2026-08-14' },
  { fullName: 'Maame Boateng', email: 'maameboat@outlook.com', submittedDate: '2026-02-10T18:23:52.815Z', eventDate: '2026-02-28' },
  { fullName: 'Monica Tran', email: 'monicatran97@gmail.com', submittedDate: '2026-02-11T21:51:34.534Z', eventDate: '2026-04-11' },
  { fullName: 'Fathi', email: 'fathi_shire@hotmail.com', submittedDate: '2026-02-14T22:17:20.851Z', eventDate: '2026-03-28' },
  { fullName: 'Karen Dang-nguyen', email: 'karendang1997@hotmail.com', submittedDate: '2026-02-16T15:35:10.135Z', eventDate: '2026-04-18' },
  { fullName: 'Preeti', email: 'pmahendroo@gmail.com', submittedDate: '2026-02-16T21:31:47.904Z', eventDate: '2026-04-18' },
  { fullName: 'Poomeja Kamalan', email: 'poomeja.kamalan@gmail.com', submittedDate: '2026-02-19T00:43:40.957Z', eventDate: '2026-05-30' },
  { fullName: 'Nazneem Singh', email: 'nazneemsingh@hotmail.com', submittedDate: '2026-02-19T01:28:36.214Z', eventDate: '2026-03-29' },
  { fullName: 'Clarissa Eggen', email: 'ceggen123@gmail.com', submittedDate: '2026-02-19T20:04:05.349Z', eventDate: '2026-03-07' },
  { fullName: 'Vida', email: 'vidahashimi6@outlook.com', submittedDate: '2026-02-20T18:02:44.078Z', eventDate: '2026-06-14' },
  { fullName: 'Sukhdeep Kaur Kalsi', email: 'contact@skalsi.ca', submittedDate: '2026-02-22T20:35:46.131Z', eventDate: '2026-04-11' },
  { fullName: 'Ellen Rockson', email: 'ellenrockson@hotmail.com', submittedDate: '2026-02-25T05:21:25.812Z', eventDate: '2026-03-01' },
  { fullName: 'Laureen Ogbemi', email: 'laureen.ogbemi@gmail.com', submittedDate: '2026-02-25T16:21:54.583Z', eventDate: '2026-03-07' },
  { fullName: 'Anne Vu', email: 'q.annevu@hotmail.com', submittedDate: '2026-02-25T21:38:15.778Z', eventDate: '2026-03-21' },
  { fullName: 'Mia Soler', email: 'miasolerr@hotmail.com', submittedDate: '2026-02-25T21:55:58.737Z', eventDate: '2026-10-03' },
  { fullName: 'Nabiha Chowdhury', email: 'togetherwnk@gmail.com', submittedDate: '2026-02-26T02:36:59.726Z', eventDate: '2026-05-23' },
  { fullName: 'Jayla Theodore', email: 'jaylatheodore25@gmail.com', submittedDate: '2026-02-27T15:30:01.872Z', eventDate: '2026-03-14' },
  { fullName: 'Kimberly Le', email: 'kimberly_le_@hotmail.com', submittedDate: '2026-03-01T07:54:01.159Z', eventDate: '2026-03-14' },
  { fullName: 'Andrea Mendoza', email: '6ixgetfitfam@gmail.com', submittedDate: '2026-03-03T14:13:29.738Z', eventDate: '2026-04-18' },
  { fullName: 'Tiffanie Christopher', email: 'tiffanie.christopher@outlook.com', submittedDate: '2026-03-03T18:21:54.515Z', eventDate: '2026-03-21', notes: '18 guests' },
  { fullName: 'Tiffanie', email: 'tiffanie.christopher@outlook.com', submittedDate: '2026-03-03T18:24:15.187Z', eventDate: '2026-03-21', notes: '15 guests' },
  { fullName: 'Lisa Libia', email: 'lisalibia@hotmail.com', submittedDate: '2026-03-03T21:47:36.814Z', eventDate: '2027-05-23' },
  { fullName: 'Mello', email: '3pointdetaing@gmail.com', submittedDate: '2026-03-03T22:46:13.334Z', eventDate: '2026-04-19' },
  { fullName: 'Emily Galora', email: 'egalora@me.com', submittedDate: '2026-03-04T03:11:34.762Z', eventDate: '2026-09-12' },
  { fullName: 'Grace Esther Yapo', email: 'graceesther656@gmail.com', submittedDate: '2026-03-04T03:51:00.818Z', eventDate: '2026-03-21' },
  { fullName: 'Mellz', email: 'mellzd3@gmail.com', submittedDate: '2026-03-04T20:39:14.199Z', eventDate: '2026-04-19' },
  { fullName: 'Amsabi Kajendiran', email: 'amsabik123@gmail.com', submittedDate: '2026-03-05T04:44:46.645Z', eventDate: '2026-04-25' },
  { fullName: 'Lenique Peak-Lindsay', email: 'leniquepl@gmail.com', submittedDate: '2026-03-06T18:57:13.116Z', eventDate: '2026-04-26' },
  { fullName: 'Avneet Boparai', email: 'avneetboparai107@gmail.com', submittedDate: '2026-03-08T16:49:42.200Z', eventDate: '2026-04-11' },
  { fullName: 'Vanessa Sauve', email: 'vanessasauve22@gmail.com', submittedDate: '2026-03-09T02:56:42.149Z', eventDate: '2026-06-13' },
  { fullName: 'Alexandra Centena', email: 'centenaalexandra@yahoo.com', submittedDate: '2026-03-09T03:12:21.434Z', eventDate: '2026-03-15' },
  { fullName: 'Adrianna Villiva', email: 'adriannamvilliva@gmail.com', submittedDate: '2026-03-09T17:41:49.898Z', eventDate: '2026-05-23' },
  { fullName: 'Christine Galang', email: 'christinelols@hotmail.com', submittedDate: '2026-03-10T00:42:15.910Z', eventDate: '2026-03-22' },
  { fullName: 'Aliyah Adamson', email: 'aliyahadamson@hotmail.com', submittedDate: '2026-03-10T06:07:16.694Z', eventDate: '2026-05-16' },
  { fullName: 'Palak Mehta', email: 'palakyasikamehta@gmail.com', submittedDate: '2026-03-10T20:53:05.605Z', eventDate: '2026-08-14' },
  { fullName: 'Lisa Tomaira', email: 'lisa.ammar18@gmail.com', submittedDate: '2026-03-11T20:59:15.942Z', eventDate: '2026-03-18' },
  { fullName: 'Gurpreen', email: 'gurpreenss@gmail.com', submittedDate: '2026-03-13T20:46:10.088Z', eventDate: '2026-03-13' },
  { fullName: 'Samantha Mitchell', email: 'samantha.mitchellc@gmail.com', submittedDate: '2026-03-15T17:54:48.896Z', eventDate: '2026-05-09' },
  { fullName: 'Jamila R', email: 'Jkaceyann15@gmail.com', submittedDate: '2026-03-16T03:07:01.937Z', eventDate: '2026-12-28' },
  { fullName: 'Aaliyah Ebrahim', email: 'aaliyahebrahim@hotmail.com', submittedDate: '2026-03-16T05:43:40.819Z', eventDate: '2026-03-27' },
  { fullName: 'Divisha', email: 'divisha15s@gmail.com', submittedDate: '2026-03-16T10:50:36.447Z', eventDate: '2026-04-12' },
  { fullName: 'Dominique Watson', email: 'dominiquewatson@hotmail.ca', submittedDate: '2026-03-19T00:32:37.116Z', eventDate: '2026-04-05' },
  { fullName: 'Raquelle R', email: 'raquelle.r@hotmail.com', submittedDate: '2026-03-19T13:02:24.466Z', eventDate: '2026-04-18' },
  { fullName: 'Simran Sardana', email: 'sardana427@gmail.com', submittedDate: '2026-03-19T15:16:10.675Z', eventDate: '2026-04-26' },
  { fullName: 'Favour Gboms', email: 'favvvvy400@gmail.com', submittedDate: '2026-03-19T17:04:11.546Z', eventDate: '2026-04-24' },
  { fullName: 'Shaniece Green', email: 'shaniece@shopbrwn.com', submittedDate: '2026-03-19T20:59:39.527Z', eventDate: '2026-04-18' },
  { fullName: 'Avneet boparai (Bridal)', email: 'avneetboparai107@gmail.com', submittedDate: '2026-03-20T23:16:05.658Z', eventDate: '2026-04-11' },
  { fullName: 'Mariam Soliman', email: 'mariamsolimann945@gmail.com', submittedDate: '2026-03-22T22:19:22.783Z', eventDate: '2026-04-01' },
  { fullName: 'Malary Sinanan', email: 'malarysinanan@gmail.com', submittedDate: '2026-03-23T21:16:10.826Z', eventDate: '2026-04-17' },
  { fullName: 'Ashley Galloway', email: 'ashley.galloway5@hotmail.com', submittedDate: '2026-03-24T02:21:17.318Z', eventDate: '2026-05-31' },
  { fullName: 'Rochelle Dleikan', email: 'ralrawdah@live.com', submittedDate: '2026-03-25T11:36:00.257Z', eventDate: '2026-04-12' },
  { fullName: 'Nabilah Patel', email: 'nabilahpatel11@gmail.com', submittedDate: '2026-03-27T17:53:59.905Z', eventDate: '2026-04-05' },
  { fullName: 'Nabilah Patel', email: 'nabilahpatel11@gmail.com', submittedDate: '2026-03-28T12:45:28.646Z', eventDate: '2026-04-03' },
  { fullName: 'Nabilah Patel', email: 'nabilahpatel11@gmail.com', submittedDate: '2026-03-28T12:47:12.670Z', eventDate: '2026-04-05' },
  { fullName: 'Lamar Sunnokrot', email: 'lamarsunnokrot05@gmail.com', submittedDate: '2026-03-30T17:50:39.832Z', eventDate: '2026-05-04' },
  { fullName: 'Vashti Bagot', email: 'vashtibagot@gmail.com', submittedDate: '2026-04-05T00:09:59.582Z', eventDate: '2026-07-25' },
  { fullName: 'Michelle Gonzalez', email: 'michellegonzalez040595@gmail.com', submittedDate: '2026-04-05T20:11:08.114Z', eventDate: '2026-05-02' },
  { fullName: 'Siham Ibrahim', email: 'siham.j.i@outlook.com', submittedDate: '2026-04-05T22:47:04.574Z', eventDate: '2026-04-11' },
  { fullName: 'Uyi esther Izekor', email: 'estherizekor1@gmail.com', submittedDate: '2026-04-06T16:54:51.505Z', eventDate: '2026-05-08' },
  { fullName: 'Maya Khan', email: '17.maya.khan@gmail.com', submittedDate: '2026-04-07T11:29:23.592Z', eventDate: '2026-04-18' },
  { fullName: 'Ragina Jhamat', email: 'ragina_jhamat@hotmail.com', submittedDate: '2026-04-07T15:21:06.632Z', eventDate: '2026-05-09' },
  { fullName: 'makayla sillars', email: 'makayla.sillars@gmail.com', submittedDate: '2026-04-11T15:07:02.628Z', eventDate: '2026-05-14' },
  { fullName: 'Jamad Hassan', email: 'Jamad.hassan17@gmail.com', submittedDate: '2026-04-13T07:18:01.923Z', eventDate: '2026-05-31' },
  { fullName: 'Sharon persaud', email: 'sharonpersaud19@gmail.com', submittedDate: '2026-04-13T16:35:18.740Z', eventDate: '2026-05-30' },
  { fullName: 'Shuby S', email: 'shubysekhon@gmail.com', submittedDate: '2026-04-14T13:18:33.635Z', eventDate: '2026-05-30' },
  { fullName: 'Mars Docrat', email: 'docratammara@gmail.com', submittedDate: '2026-04-14T23:15:25.824Z', eventDate: '2026-04-18' },
  { fullName: 'Ekta Rana', email: 'ektarana23@hotmail.com', submittedDate: '2026-04-15T14:04:51.241Z', eventDate: '2026-04-25' },
];

Deno.serve(async (req) => {
  try {
  const base44 = createClientFromRequest(req);

  // Fetch all records
  const { offset = 0 } = await req.json().catch(() => ({}));
  const records = await base44.asServiceRole.entities.EventRequest.list('-created_date', 50, offset);

  let updated = 0;
  let skipped = 0;

  const toUpdate = [];

  for (const record of records) {
    const email = record.email?.toLowerCase().trim();
    const eventDate = record.event_date;
    const fullName = record.full_name?.toLowerCase().trim();

    let csvMatch = CSV_DATA.find(c =>
      c.email.toLowerCase() === email && c.eventDate === eventDate
    );

    if (!csvMatch) {
      csvMatch = CSV_DATA.find(c =>
        c.email.toLowerCase() === email &&
        c.fullName.toLowerCase().trim().startsWith(fullName.substring(0, 5))
      );
    }

    if (csvMatch) {
      toUpdate.push({ id: record.id, submittedDate: csvMatch.submittedDate });
    } else {
      skipped++;
    }
  }

  // Process sequentially with delay to avoid rate limits
  for (const item of toUpdate) {
    await base44.asServiceRole.entities.EventRequest.update(item.id, {
      submitted_date: item.submittedDate
    });
    updated++;
    await new Promise(r => setTimeout(r, 120));
  }

  return Response.json({ success: true, updated, skipped, total: records.length });
  } catch(e) {
    console.error('Error:', e.message, e.stack);
    return Response.json({ error: e.message }, { status: 500 });
  }
});