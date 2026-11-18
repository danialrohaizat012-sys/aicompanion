"""Build the Bahasa Melayu pages (ms/index.html, ms/configure.html) from the English pages.

Run after any change to index.html or configure.html:  python3 tools/build-ms.py
Every English string below must still exist in the source page, so a changed sentence fails loudly
instead of silently staying in English. Text inside JavaScript is translated in assets/*.js via T().
"""
import os, re, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
WA_EN = 'https://wa.me/60199400004?text=Hi%20Cipta%20Robo%2C%20I%27m%20interested%20in%20NURI.%20Please%20keep%20me%20posted.'
WA_MS = 'https://wa.me/60199400004?text=Hai%20Cipta%20Robo%2C%20saya%20berminat%20dengan%20NURI.%20Mohon%20maklumkan%20saya.'

COMMON = [
    ('aria-label="Cipta Robo home"', 'aria-label="Laman utama Cipta Robo"'),
    ('<div class="wrap collab"><span>In collaboration with</span>', '<div class="wrap collab"><span>Dengan kerjasama</span>'),
    ('aria-label="BinaLab (opens in a new tab)"', 'aria-label="BinaLab (dibuka dalam tab baru)"'),
    ('· Made in Malaysia', '· Buatan Malaysia'),
    ('>Design rules</a>', '>Panduan reka bentuk</a>'),
]

INDEX = [
    ('<a class="skip" href="#main">Skip to content</a>', '<a class="skip" href="#main">Langkau ke kandungan</a>'),
    ('<title>NURI by Cipta Robo · A desktop AI companion</title>', '<title>NURI oleh Cipta Robo · Teman AI di atas meja</title>'),
    ('content="NURI is a desktop AI companion built on the M5Stack StackChan K151, with a suit you choose, a charging dock and its name engraved. Target price RM999. In development."',
     'content="NURI ialah teman AI di atas meja berasaskan M5Stack StackChan K151, dengan sut pilihan anda, dock pengecas dan nama yang diukir. Harga sasaran RM999. Dalam pembangunan."'),
    ('<meta property="og:title" content="NURI by Cipta Robo">', '<meta property="og:title" content="NURI oleh Cipta Robo">'),
    ('content="One NURI. Endless possibilities. A desktop AI companion in development in Malaysia."', 'content="Satu NURI. Pelbagai kegunaan. Teman AI di atas meja yang sedang dibangunkan di Malaysia."'),
    ('<button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav">Menu</button>', '<button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav">Menu</button>'),
    ('<nav class="nav" id="nav" aria-label="Main">', '<nav class="nav" id="nav" aria-label="Utama">'),
    ('<a href="#uses">What it does</a><a href="#in-action">In action</a><a href="#character">Personality</a><a href="#make-it-yours">Make it yours</a><a href="#add-ons">Add-ons</a><a href="#accessories">Accessories</a><a href="#faq">FAQ</a><a href="#contact">Contact</a>',
     '<a href="#uses">Kegunaan</a><a href="#in-action">Lihat NURI</a><a href="#character">Personaliti</a><a href="#make-it-yours">Pilihan</a><a href="#add-ons">Add-on</a><a href="#accessories">Aksesori</a><a href="#faq">Soalan</a><a href="#contact">Hubungi</a>'),
    ('<a class="btn btn-primary btn-sm" href="configure.html">Configure</a>', '<a class="btn btn-primary btn-sm" href="configure.html">Reka NURI</a>'),
    # hero
    ('<span class="status">NURI V1 · in development</span>', '<span class="status">NURI V1 · dalam pembangunan</span>'),
    ('<h1>One NURI.<br>Endless possibilities.</h1>', '<h1>Satu NURI.<br>Pelbagai kegunaan.</h1>'),
    ('<p class="lead">A small AI companion for your desk, designed to help you learn, greet your customers, keep your day on track and check in on the people you care about. Built on the M5Stack StackChan K151, dressed in a suit you choose, with its name engraved on its dock.</p>',
     '<p class="lead">Teman AI kecil untuk meja anda, direka untuk membantu anda belajar, menyambut pelanggan, mengurus hari anda dan bertanya khabar orang tersayang. Dibina atas M5Stack StackChan K151, memakai sut pilihan anda, dengan namanya diukir pada dock.</p>'),
    ('<span class="muted">target price · charging dock and engraving included</span>', '<span class="muted">harga sasaran · termasuk dock pengecas dan ukiran</span>'),
    ('<a class="btn btn-primary" href="configure.html">Configure your NURI</a><a class="link-arrow" href="#uses">See what it can do</a>', '<a class="btn btn-primary" href="configure.html">Reka NURI anda</a><a class="link-arrow" href="#uses">Lihat kegunaannya</a>'),
    ('aria-label="Interactive 3D model of NURI on its charging dock"', 'aria-label="Model 3D interaktif NURI di atas dock pengecasnya"'),
    ('alt="NURI in the Signature look on the Slim Dock, engraved NURI KRONT"', 'alt="NURI rupa Signature di atas Slim Dock, diukir NURI KRONT"'),
    ('<span class="stage-note">3D model · drag to turn</span>', '<span class="stage-note">Model 3D · seret untuk pusing</span>'),
    ('<p><b>Real, proven hardware</b><span>The original M5Stack StackChan K151, with a camera, microphones, touch and two-axis movement.</span></p>',
     '<p><b>Perkakasan sebenar dan terbukti</b><span>M5Stack StackChan K151 asli, dengan kamera, mikrofon, sentuhan dan pergerakan dua paksi.</span></p>'),
    ('<p><b>Charges while it works</b><span>Slide it onto its dock. The dock\'s USB-C plug feeds the K151\'s own charging port.</span></p>',
     '<p><b>Mengecas sambil bekerja</b><span>Letak di atas dock. Palam USB-C dock terus masuk ke port pengecas K151.</span></p>'),
    ('<p><b>Named by you</b><span>Every dock is engraved with NURI and your companion\'s name. Free.</span></p>',
     '<p><b>Nama pilihan anda</b><span>Setiap dock diukir dengan NURI dan nama teman anda. Percuma.</span></p>'),
    # uses
    ('<span class="label">Discover what NURI can do</span><h2 style="margin-top:12px">Four ways to use one NURI.</h2>', '<span class="label">Apa NURI boleh buat</span><h2 style="margin-top:12px">Empat cara guna satu NURI.</h2>'),
    ('<p class="lead">These are not four models or four plans. Every NURI shares the same hardware and software, so you can use it for all of them in the same day. Nothing to unlock.</p>',
     '<p class="lead">Ini bukan empat model atau empat pelan. Setiap NURI berkongsi perkakasan dan perisian yang sama, jadi anda boleh guna untuk semuanya dalam hari yang sama. Tiada apa perlu dibuka kunci.</p>'),
    ('<article class="use"><span class="label">Learn</span><h3>A patient study partner</h3><q>Show me where I went wrong.</q><ul><li>Step-by-step hints, not just answers</li><li>Speaking practice in Bahasa Melayu, English, Mandarin, Japanese</li><li>Quizzes and study timers</li></ul><span class="status">Concept</span></article>',
     '<article class="use"><span class="label">Learn</span><h3>Rakan belajar yang sabar</h3><q>Tunjukkan di mana saya salah.</q><ul><li>Petunjuk langkah demi langkah, bukan sekadar jawapan</li><li>Latihan bertutur dalam Bahasa Melayu, Inggeris, Mandarin, Jepun</li><li>Kuiz dan pemasa belajar</li></ul><span class="status">Konsep</span></article>'),
    ('<article class="use"><span class="label">Reception</span><h3>A friendly face at the counter</h3><q>Welcome! Check our services or take a number?</q><ul><li>Answers FAQs you approve</li><li>Digital queue numbers</li><li>Calls a staff member when unsure</li></ul><span class="status">Concept</span></article>',
     '<article class="use"><span class="label">Reception</span><h3>Wajah mesra di kaunter</h3><q>Selamat datang! Nak semak servis atau ambil nombor?</q><ul><li>Jawab soalan lazim yang anda luluskan</li><li>Nombor giliran digital</li><li>Panggil staf bila tak pasti</li></ul><span class="status">Konsep</span></article>'),
    ('<article class="use"><span class="label">Assist</span><h3>Your desk command centre</h3><q>What matters most today?</q><ul><li>Daily brief from apps you connect</li><li>Drafts and summaries on your laptop</li><li>Asks before it changes anything</li></ul><span class="status">Concept</span></article>',
     '<article class="use"><span class="label">Assist</span><h3>Pusat kawalan di meja anda</h3><q>Apa paling penting hari ni?</q><ul><li>Taklimat harian dari aplikasi yang anda sambung</li><li>Draf dan ringkasan di laptop anda</li><li>Tanya dulu sebelum ubah apa-apa</li></ul><span class="status">Konsep</span></article>'),
    ('<article class="use"><span class="label">Companion</span><h3>A little presence, every day</h3><q>Good morning. Shall we call your daughter?</q><ul><li>Conversation, reminders and check-ins</li><li>Simple family contact</li><li>A manual help button, not a medical device</li></ul><span class="status">Concept</span></article>',
     '<article class="use"><span class="label">Companion</span><h3>Teman kecil, setiap hari</h3><q>Selamat pagi. Nak telefon anak?</q><ul><li>Berbual, peringatan dan tanya khabar</li><li>Hubungi keluarga dengan mudah</li><li>Butang bantuan manual, bukan alat perubatan</li></ul><span class="status">Konsep</span></article>'),
    ('<p><strong>And the list goes on.</strong> Homework helper, shop greeter, study timer, bedtime storyteller, desk buddy. NURI\'s purpose is limited only by your creativity.</p>',
     '<p><strong>Dan banyak lagi.</strong> Pembantu kerja sekolah, penyambut di kedai, pemasa belajar, pencerita sebelum tidur, kawan di meja. Kegunaan NURI hanya terhad pada kreativiti anda.</p>'),
    ('<p class="note">Each use is developed in stages and marked Concept until it has been built and tested. Only tested features will be offered.</p>',
     '<p class="note">Setiap kegunaan dibangunkan secara berperingkat dan ditanda Konsep sehingga siap dibina dan diuji. Hanya ciri yang telah diuji akan ditawarkan.</p>'),
    # in action
    ('<span class="label">NURI in action</span><h2 style="margin-top:12px">See where NURI fits in your day.</h2>', '<span class="label">Lihat NURI beraksi</span><h2 style="margin-top:12px">Di mana NURI sesuai dalam hari anda.</h2>'),
    ('<p class="lead">Short concept animations made with the same 3D model as this site, with an AI-generated voice. Turn the sound on to hear NURI. They show how NURI is designed to help; the features themselves are still in development.</p>',
     '<p class="lead">Animasi konsep pendek menggunakan model 3D yang sama seperti laman ini, dengan suara yang dijana AI. Hidupkan bunyi untuk dengar NURI. Ia menunjukkan bagaimana NURI direka untuk membantu; ciri-cirinya masih dalam pembangunan.</p>'),
    ('aria-label="Animated scenes of NURI in use"', 'aria-label="Babak animasi NURI sedang digunakan"'),
    ('<span class="scene-tag">Concept animation</span>', '<span class="scene-tag">Animasi konsep</span>'),
    ('aria-label="Sound"><svg', 'aria-label="Bunyi"><svg'),
    ('<span>Sound off</span></button><button type="button" class="play-btn" id="playBtn" aria-pressed="true">Pause</button>', '<span>Bunyi tutup</span></button><button type="button" class="play-btn" id="playBtn" aria-pressed="true">Jeda</button>'),
    ('<div class="chips" role="tablist" aria-label="Scenes">', '<div class="chips" role="tablist" aria-label="Babak">'),
    ('<b>Learn</b><span>Homework at the desk</span>', '<b>Learn</b><span>Kerja sekolah di meja</span>'),
    ('<b>Reception</b><span>Greeting customers at the counter</span>', '<b>Reception</b><span>Menyambut pelanggan di kaunter</span>'),
    ('<b>Assist</b><span>Morning brief before work</span>', '<b>Assist</b><span>Taklimat pagi sebelum kerja</span>'),
    ('<b>Companion</b><span>An evening check-in</span>', '<b>Companion</b><span>Tanya khabar waktu malam</span>'),
    # character
    ('<span class="label">Personalise the character</span>', '<span class="label">Bentuk perwatakannya</span>'),
    ('<h2 style="margin:12px 0 18px">Its personality, shaped by you. Its brain, the AI you already use.</h2>', '<h2 style="margin:12px 0 18px">Personalitinya dibentuk oleh anda. Otaknya, AI yang anda sudah guna.</h2>'),
    ('<p class="lead">Give NURI a name, a voice and a way of talking that feels right. Then connect it to your favourite AI, such as ChatGPT or Claude, so the conversations you already enjoy now have a face on your desk. The more you talk, the better it knows you.</p>',
     '<p class="lead">Beri NURI nama, suara dan cara bercakap yang anda suka. Kemudian sambungkan ke AI kegemaran anda, seperti ChatGPT atau Claude, supaya perbualan yang anda sudah biasa kini ada wajah di atas meja. Makin kerap berbual, makin NURI kenal anda.</p>'),
    ('<span class="status" style="margin-top:22px">Concept · planned features</span>', '<span class="status" style="margin-top:22px">Konsep · ciri yang dirancang</span>'),
    ('<li><b>Name and personality</b><span>Choose its name, voice, tone and how chatty it is: calm tutor, cheerful buddy or focused assistant.</span></li>',
     '<li><b>Nama dan personaliti</b><span>Pilih nama, suara, nada dan berapa peramah ia: tutor yang tenang, kawan yang ceria atau pembantu yang fokus.</span></li>'),
    ('<li><b>Bring your favourite AI</b><span>Pick the model behind NURI, such as ChatGPT or Claude, and switch any time. Your character settings stay the same.</span></li>',
     '<li><b>Guna AI kegemaran anda</b><span>Pilih model di sebalik NURI, seperti ChatGPT atau Claude, dan tukar bila-bila masa. Tetapan perwatakan kekal sama.</span></li>'),
    ('<li><b>A bond that grows</b><span>With your permission, NURI remembers your routines, interests and goals. You can view or delete what it remembers whenever you like.</span></li>',
     '<li><b>Hubungan yang makin rapat</b><span>Dengan izin anda, NURI ingat rutin, minat dan matlamat anda. Anda boleh lihat atau padam apa yang diingatinya bila-bila masa.</span></li>'),
    ('<p class="note">ChatGPT is a product of OpenAI and Claude is a product of Anthropic. NURI is not affiliated with either. Connecting an AI service may need your own account and is subject to that provider\'s terms and pricing.</p>',
     '<p class="note">ChatGPT ialah produk OpenAI dan Claude ialah produk Anthropic. NURI tiada kaitan dengan kedua-duanya. Menyambung servis AI mungkin memerlukan akaun anda sendiri dan tertakluk pada terma serta harga penyedia tersebut.</p>'),
    # make it yours
    ('<span class="label">Make it yours</span><h2 style="margin-top:12px">Three looks. Three colours. Two docks.</h2>', '<span class="label">Jadikan milik anda</span><h2 style="margin-top:12px">Tiga rupa. Tiga warna. Dua dock.</h2>'),
    ('<p class="lead">A short list on purpose. Every part is designed to clip onto the K151\'s existing mounting holes, leave the sensors, ports and vents open, and clear the robot\'s full range of movement. All of it is checked in our 3D model; physical fit testing is next.</p>',
     '<p class="lead">Pilihan sengaja ringkas. Setiap bahagian direka untuk dipasang pada lubang pemasangan sedia ada K151, tidak menutup sensor, port dan lubang udara, serta tidak menghalang pergerakan penuh robot. Semuanya disemak dalam model 3D kami; ujian muat fizikal seterusnya.</p>'),
    ('<div class="subhead"><h3>Looks</h3><span class="muted small">Snap-on suit · no tools, no glue</span></div>', '<div class="subhead"><h3>Rupa</h3><span class="muted small">Sut pasang klik · tanpa alat, tanpa gam</span></div>'),
    ('alt="NURI in the Signature look"', 'alt="NURI rupa Signature"'),
    ('<p>Slim face frame and soft side panels. The everyday NURI.</p>', '<p>Bingkai muka nipis dan panel sisi lembut. NURI untuk setiap hari.</p>'),
    ('alt="NURI in the Focus look with headphone-style side cups"', 'alt="NURI rupa Focus dengan cawan sisi gaya fon kepala"'),
    ('<p>Headphone-style side cups with a high, open band. Made for study and work.</p>', '<p>Cawan sisi gaya fon kepala dengan lengkung atas yang terbuka. Untuk belajar dan bekerja.</p>'),
    ('alt="NURI in the Buddy look with small side ears"', 'alt="NURI rupa Buddy dengan telinga sisi kecil"'),
    ('<p>Rounded frame and small side ears. Friendly at home and at the counter.</p>', '<p>Bingkai bulat dan telinga sisi kecil. Mesra di rumah dan di kaunter.</p>'),
    ('<div class="subhead"><h3>Colours</h3><span class="muted small">The K151 stays white; the suit carries the colour</span></div>', '<div class="subhead"><h3>Warna</h3><span class="muted small">K151 kekal putih; warna datang dari sut</span></div>'),
    ('<div class="subhead"><h3>Charging docks</h3><span class="muted small">Both engraved with NURI + name</span></div>', '<div class="subhead"><h3>Dock pengecas</h3><span class="muted small">Kedua-dua diukir NURI + nama</span></div>'),
    ('alt="Slim Dock engraved NURI KRONT"', 'alt="Slim Dock diukir NURI KRONT"'),
    ('<span>Included</span></div><p>A low tray that disappears on a desk. Slide NURI in and it charges while it works.</p>', '<span>Termasuk</span></div><p>Dulang rendah yang tak menonjol di atas meja. Letak NURI dan ia mengecas sambil bekerja.</p>'),
    ('alt="Nest Dock: a shallow bowl wrapped in woven rings, engraved NURI REKA"', 'alt="Nest Dock: mangkuk cetek dililit cincin anyaman, diukir NURI REKA"'),
    ('<p>A shallow bowl wrapped in thin woven rings, like a small nest. The gaps between the rings let the base breathe.</p>', '<p>Mangkuk cetek dililit cincin anyaman nipis, macam sarang kecil. Celah antara cincin membolehkan udara mengalir ke tapak.</p>'),
    ('<a class="btn btn-primary" href="configure.html">Build yours in 3D</a>', '<a class="btn btn-primary" href="configure.html">Reka NURI anda dalam 3D</a>'),
    # box
    ('<span class="label">What RM999 includes</span>', '<span class="label">Apa termasuk dalam RM999</span>'),
    ('<h2 style="margin:12px 0 28px">Everything you need on day one.</h2>', '<h2 style="margin:12px 0 28px">Semua yang anda perlu pada hari pertama.</h2>'),
    ('<li><span>M5Stack StackChan K151 robot</span><span>Original hardware</span></li>', '<li><span>Robot M5Stack StackChan K151</span><span>Perkakasan asli</span></li>'),
    ('<li><span>NURI Suit in your look and colour</span><span>3 looks · 3 colours</span></li>', '<li><span>NURI Suit dalam rupa dan warna pilihan</span><span>3 rupa · 3 warna</span></li>'),
    ('<li><span>Slim charging dock</span><span>Nest Dock +RM50</span></li>', '<li><span>Dock pengecas Slim</span><span>Nest Dock +RM50</span></li>'),
    ('<li><span>Engraved nameplate: NURI + your companion\'s name</span><span>Free</span></li>', '<li><span>Ukiran nama: NURI + nama teman anda</span><span>Percuma</span></li>'),
    ('<li><span>USB-C cable and quick start guide</span><span></span></li>', '<li><span>Kabel USB-C dan panduan mula</span><span></span></li>'),
    ('<div class="box-total"><span class="muted">Target price</span>', '<div class="box-total"><span class="muted">Harga sasaran</span>'),
    ('<p class="note">Orders are not open yet. Cloud AI services may carry a separate cost; how that works will be confirmed before launch.</p>', '<p class="note">Tempahan belum dibuka. Servis AI awan mungkin ada kos berasingan; caranya akan disahkan sebelum pelancaran.</p>'),
    ('alt="NURI with the Signature look on its Slim Dock, engraved NURI REKA"', 'alt="NURI rupa Signature di atas Slim Dock, diukir NURI REKA"'),
    # add-ons
    ('<span class="label">Optional add-ons</span><h2 style="margin-top:12px">Take NURI further.</h2>', '<span class="label">Add-on pilihan</span><h2 style="margin-top:12px">Bawa NURI lebih jauh.</h2>'),
    ('<p class="lead">Two accessories in development. Neither is needed to use NURI. Prices will be announced once they have been prototyped.</p>', '<p class="lead">Dua aksesori dalam pembangunan. Kedua-duanya tidak wajib untuk guna NURI. Harga akan diumumkan selepas prototaip siap.</p>'),
    ('<div class="tabs" role="tablist" aria-label="Add-ons">', '<div class="tabs" role="tablist" aria-label="Add-on">'),
    ('<span class="stage-note" id="addonNote">Animated 3D model · drag to turn</span>', '<span class="stage-note" id="addonNote">Model 3D beranimasi · seret untuk pusing</span>'),
    # accessories
    ('<span class="label">Accessories</span><h2 style="margin-top:12px">Take NURI with you.</h2>', '<span class="label">Aksesori</span><h2 style="margin-top:12px">Bawa NURI ke mana-mana.</h2>'),
    ('<p class="lead">Two wearable carriers in development, so you can talk to NURI while you walk. Both hold NURI by its base in a locking cradle, keep it charged from a small battery and leave its head free to turn to you.</p>',
     '<p class="lead">Dua pembawa boleh pakai dalam pembangunan, supaya anda boleh berbual dengan NURI sambil berjalan. Kedua-duanya memegang NURI pada tapaknya dalam cradle berkunci, mengecasnya dari bateri kecil dan membiarkan kepalanya bebas berpusing ke arah anda.</p>'),
    ('<div class="tabs" role="tablist" aria-label="Accessories">', '<div class="tabs" role="tablist" aria-label="Aksesori">'),
    ('<span class="stage-note" id="accNote">Animated 3D model · drag to turn</span>', '<span class="stage-note" id="accNote">Model 3D beranimasi · seret untuk pusing</span>'),
    ('<p class="note">Out and about, NURI connects through your phone\'s hotspot. Not for use while driving or cycling. Fit, weight, battery life and safety will be tested before any sale.</p>',
     '<p class="note">Di luar, NURI bersambung melalui hotspot telefon anda. Bukan untuk digunakan semasa memandu atau berbasikal. Kesesuaian, berat, hayat bateri dan keselamatan akan diuji sebelum dijual.</p>'),
    # hardware
    ('<span class="label">Designed around the real robot</span><h2 style="margin-top:12px">Measured, not imagined.</h2>', '<span class="label">Direka ikut robot sebenar</span><h2 style="margin-top:12px">Diukur, bukan diagak.</h2>'),
    ('<p class="lead">Every suit part and dock is modelled on M5Stack\'s published K151 structure files, then checked against the robot\'s touch zones, display, ports, vents and full movement.</p>',
     '<p class="lead">Setiap bahagian sut dan dock dimodelkan berdasarkan fail struktur K151 yang diterbitkan M5Stack, kemudian disemak dengan zon sentuh, skrin, port, lubang udara dan pergerakan penuh robot.</p>'),
    ('<dt>Size</dt><dd>54 × 61.5 × 70.5 mm (W × D × H)</dd>', '<dt>Saiz</dt><dd>54 × 61.5 × 70.5 mm (L × D × T)</dd>'),
    ('<dt>Movement</dt><dd>Turns ±130°, looks 6° down to 74° up</dd>', '<dt>Pergerakan</dt><dd>Pusing ±130°, tunduk 6° hingga dongak 74°</dd>'),
    ('<dt>Display</dt><dd>2.0" touch screen, front camera</dd>', '<dt>Skrin</dt><dd>Skrin sentuh 2.0", kamera depan</dd>'),
    ('<dt>Charging</dt><dd>USB-C on the base, through the dock</dd>', '<dt>Pengecasan</dt><dd>USB-C di tapak, melalui dock</dd>'),
    ('<dt>Suit mounting</dt><dd>Three existing side holes per side, 8 mm apart</dd>', '<dt>Pemasangan sut</dt><dd>Tiga lubang sedia ada setiap sisi, jarak 8 mm</dd>'),
    ('<dt>Kept open</dt><dd>Top touch zones, LED bars, screen, camera, side USB-C and power button</dd>', '<dt>Kekal terbuka</dt><dd>Zon sentuh atas, bar LED, skrin, kamera, USB-C sisi dan butang kuasa</dd>'),
    ('<dt>Ventilation</dt><dd>Docks lift the base on ribs (2 mm air gap); side vents on the Slim, open weave on the Nest</dd>', '<dt>Pengudaraan</dt><dd>Dock mengangkat tapak atas rusuk (ruang udara 2 mm); lubang udara sisi pada Slim, anyaman terbuka pada Nest</dd>'),
    ('<dt>Materials</dt><dd>3D-printed PETG suit and docks (planned)</dd>', '<dt>Bahan</dt><dd>Sut dan dock PETG cetakan 3D (dirancang)</dd>'),
    ('<dt>Status</dt><dd>Pre-production. Physical fit testing next.</dd>', '<dt>Status</dt><dd>Pra-pengeluaran. Ujian muat fizikal seterusnya.</dd>'),
    ('<p class="note">Measurements come from M5Stack\'s published K151 structure files. The tilt pivot is estimated until it is measured on a physical unit. <a href="https://github.com/danialrohaizat012-sys/aicompanion/blob/main/docs/k151-design-rules.md">Read the design rules</a>.</p>',
     '<p class="note">Ukuran diambil dari fail struktur K151 yang diterbitkan M5Stack. Paksi dongak masih anggaran sehingga diukur pada unit sebenar. <a href="https://github.com/danialrohaizat012-sys/aicompanion/blob/main/docs/k151-design-rules.md">Baca panduan reka bentuk</a> (Bahasa Inggeris).</p>'),
    # sheets
    ('<span class="label">Concept sheets</span><h2 style="margin-top:12px">NURI V1 on one page.</h2>', '<span class="label">Helaian konsep</span><h2 style="margin-top:12px">NURI V1 dalam satu halaman.</h2>'),
    ('<p class="lead">Two summary sheets for sharing: the product and its options, then the practical design and the add-ons. Rendered from the same 3D model as this site.</p>', '<p class="lead">Dua helaian ringkasan untuk dikongsi: produk dan pilihannya, kemudian reka bentuk praktikal dan add-on. Dijana dari model 3D yang sama seperti laman ini (dalam Bahasa Inggeris).</p>'),
    ('alt="Concept sheet: NURI V1 looks, colours, Slim and Nest docks, free engraving and what RM999 includes"', 'alt="Helaian konsep: rupa, warna, dock Slim dan Nest, ukiran percuma dan apa termasuk dalam RM999"'),
    ('<figcaption><b>Product</b><span>Looks, colours, docks, engraving, RM999</span>', '<figcaption><b>Produk</b><span>Rupa, warna, dock, ukiran, RM999</span>'),
    ('alt="Concept sheet: movement checks, Nest Dock from above, NURI Rover, NURI Board and the four uses"', 'alt="Helaian konsep: semakan pergerakan, Nest Dock dari atas, NURI Rover, NURI Board dan empat kegunaan"'),
    ('<figcaption><b>Design &amp; add-ons</b><span>Movement, Nest Dock, Rover, Board, four uses</span>', '<figcaption><b>Reka bentuk &amp; add-on</b><span>Pergerakan, Nest Dock, Rover, Board, empat kegunaan</span>'),
    ('download>Download full size</a>', 'download>Muat turun saiz penuh</a>'),
    # contact
    ('<span class="label">Register your interest</span>', '<span class="label">Daftar minat anda</span>'),
    ('<h2 style="margin:12px 0 14px">Want a NURI? Let\'s talk.</h2>', '<h2 style="margin:12px 0 14px">Nak NURI? Jom berbual.</h2>'),
    ('<p class="lead">Orders aren\'t open yet. Message us on WhatsApp to join the first batch list, ask a question or request a demo. No payment needed.</p>', '<p class="lead">Tempahan belum dibuka. Mesej kami di WhatsApp untuk masuk senarai batch pertama, bertanya atau minta demo. Tiada bayaran diperlukan.</p>'),
    ('</svg>Chat on WhatsApp</a>', '</svg>Chat di WhatsApp</a>'),
    ('<span class="muted small">+60 19-940 0004 · replies in Bahasa Melayu or English</span>', '<span class="muted small">+60 19-940 0004 · dibalas dalam Bahasa Melayu atau Inggeris</span>'),
    ('<a class="link-arrow small" href="configure.html">Configure first, then send your choice</a>', '<a class="link-arrow small" href="configure.html">Reka dulu, kemudian hantar pilihan anda</a>'),
    # faq
    ('<span class="label">Questions</span><h2 style="margin-top:12px">Straight answers.</h2>', '<span class="label">Soalan</span><h2 style="margin-top:12px">Jawapan terus terang.</h2>'),
    ('<summary>Can I order NURI now?</summary><p>Not yet. NURI is in development. The first units will be a small batch after the suit and docks have been fit-tested on real K151 robots. RM999 is the target price. <a href="' + WA_EN + '" target="_blank" rel="noopener">Message us on WhatsApp</a> to join the first batch list.</p>',
     '<summary>Boleh saya tempah NURI sekarang?</summary><p>Belum lagi. NURI masih dalam pembangunan. Unit pertama akan dikeluarkan dalam batch kecil selepas sut dan dock diuji muat pada robot K151 sebenar. RM999 ialah harga sasaran. <a href="' + WA_EN + '" target="_blank" rel="noopener">Mesej kami di WhatsApp</a> untuk masuk senarai batch pertama.</p>'),
    ('<summary>What do Learn, Reception, Assist and Companion mean?</summary><p>They are four ways to use the same NURI, not four products. Every NURI gets the same features as they are released. You never pay to unlock a use.</p>',
     '<summary>Apa maksud Learn, Reception, Assist dan Companion?</summary><p>Ia empat cara guna NURI yang sama, bukan empat produk. Setiap NURI dapat ciri yang sama bila ia dikeluarkan. Anda tak perlu bayar untuk buka sesuatu kegunaan.</p>'),
    ('<summary>Can NURI charge while it is working?</summary><p>Yes. The K151 charges through the USB-C port on its base. Both docks have a fixed USB-C plug that lines up with that port, so NURI can keep running on your desk while it charges.</p>',
     '<summary>Boleh NURI mengecas sambil bekerja?</summary><p>Boleh. K151 mengecas melalui port USB-C di tapaknya. Kedua-dua dock ada palam USB-C tetap yang sejajar dengan port itu, jadi NURI terus berfungsi di atas meja sambil mengecas.</p>'),
    ('<summary>What is the difference between the two docks?</summary><p>They charge the same way. The Slim Dock is a low, rounded tray and comes with every NURI. The Nest Dock is a shallow bowl wrapped in woven rings, for RM50 more. Both carry the free NURI + name engraving.</p>',
     '<summary>Apa beza kedua-dua dock?</summary><p>Cara mengecasnya sama. Slim Dock ialah dulang rendah bertepi bulat dan disertakan dengan setiap NURI. Nest Dock ialah mangkuk cetek dililit cincin anyaman, tambahan RM50. Kedua-duanya ada ukiran NURI + nama secara percuma.</p>'),
    ('<summary>Does the suit block anything?</summary><p>It is designed not to. Suit parts mount on the K151\'s existing side holes and leave the top touch zones, LED light bars, screen, camera, side USB-C port and power button open. Every part is checked in our 3D model against the robot\'s full range of movement, and will be tested on real K151 robots before any sale.</p>',
     '<summary>Adakah sut menutup apa-apa?</summary><p>Ia direka supaya tidak. Bahagian sut dipasang pada lubang sisi sedia ada K151 dan tidak menutup zon sentuh atas, bar lampu LED, skrin, kamera, port USB-C sisi dan butang kuasa. Setiap bahagian disemak dalam model 3D kami dengan pergerakan penuh robot, dan akan diuji pada robot K151 sebenar sebelum dijual.</p>'),
    ('<summary>Will I need a subscription?</summary><p>NURI\'s voice and AI features use cloud services that cost money to run. Whether that is included, a small subscription or bring-your-own key will be decided and stated clearly before any sale.</p>',
     '<summary>Perlu langganan ke?</summary><p>Ciri suara dan AI NURI menggunakan servis awan yang ada kos operasi. Sama ada ia termasuk, langganan kecil atau guna kunci API anda sendiri akan diputuskan dan dinyatakan dengan jelas sebelum jualan.</p>'),
    ('<summary>Is NURI suitable for children or older people?</summary><p>Both are in mind, with extra care. Child use will need guardian controls and strict privacy. The Companion help button is a convenience, not a medical or emergency device.</p>',
     '<summary>Sesuai ke NURI untuk kanak-kanak atau warga emas?</summary><p>Kedua-duanya diambil kira, dengan lebih berhati-hati. Penggunaan kanak-kanak memerlukan kawalan penjaga dan privasi yang ketat. Butang bantuan Companion hanyalah kemudahan, bukan alat perubatan atau kecemasan.</p>'),
    ('<summary>Is Cipta Robo part of M5Stack?</summary><p>No. Cipta Robo is an independent Malaysian studio. NURI is built on the M5Stack StackChan K151; reseller and branding terms are being confirmed with the supplier.</p>',
     '<summary>Adakah Cipta Robo sebahagian daripada M5Stack?</summary><p>Tidak. Cipta Robo ialah studio bebas dari Malaysia. NURI dibina atas M5Stack StackChan K151; terma penjualan semula dan penjenamaan sedang disahkan dengan pembekal.</p>'),
    # footer
    ('<a href="configure.html">Configure</a><a href="#add-ons">Add-ons</a><a href="#accessories">Accessories</a><a href="#concept-sheets">Concept sheets</a>', '<a href="configure.html">Reka NURI</a><a href="#add-ons">Add-on</a><a href="#accessories">Aksesori</a><a href="#concept-sheets">Helaian konsep</a>'),
    ('NURI is in development and not yet for sale. Images are 3D renders of the planned design. Cipta Robo is not affiliated with M5Stack.', 'NURI masih dalam pembangunan dan belum dijual. Imej ialah render 3D reka bentuk yang dirancang. Cipta Robo tiada kaitan dengan M5Stack.'),
    (WA_EN, WA_MS),
]

CONFIGURE = [
    ('<title>Configure NURI · Cipta Robo</title>', '<title>Reka NURI · Cipta Robo</title>'),
    ('content="Choose NURI\'s look, colour and charging dock, engrave its name, and preview the optional Rover and Board in 3D. Target price RM999."', 'content="Pilih rupa, warna dan dock pengecas NURI, ukir namanya, dan pratonton Rover dan Board pilihan dalam 3D. Harga sasaran RM999."'),
    ('<meta property="og:title" content="Configure your NURI · Cipta Robo">', '<meta property="og:title" content="Reka NURI anda · Cipta Robo">'),
    ('content="Pick a look, colour and charging dock, engrave its name and preview NURI in 3D. Target price RM999."', 'content="Pilih rupa, warna dan dock pengecas, ukir namanya dan lihat NURI dalam 3D. Harga sasaran RM999."'),
    ('<a class="skip" href="#steps">Skip to options</a>', '<a class="skip" href="#steps">Langkau ke pilihan</a>'),
    ('<a class="back-link" href="./">← <span class="hide-sm">Back to </span>NURI</a>', '<a class="back-link" href="./">← <span class="hide-sm">Kembali ke </span>NURI</a>'),
    ('<span class="status">Pre-production · orders not open</span><h1 style="font-size:clamp(32px,4vw,46px);margin-top:10px">Configure your NURI</h1>', '<span class="status">Pra-pengeluaran · tempahan belum dibuka</span><h1 style="font-size:clamp(32px,4vw,46px);margin-top:10px">Reka NURI anda</h1>'),
    ('aria-label="Interactive 3D preview of your NURI"', 'aria-label="Pratonton 3D interaktif NURI anda"'),
    ('<p class="muted small">Loading 3D preview…</p>', '<p class="muted small">Memuatkan pratonton 3D…</p>'),
    ('<span class="stage-note">Drag to turn · scroll or pinch to zoom</span>', '<span class="stage-note">Seret untuk pusing · skrol atau cubit untuk zum</span>'),
    ('<div class="seg" role="group" aria-label="Preview">', '<div class="seg" role="group" aria-label="Pratonton">'),
    ('aria-pressed="true">On its dock</button>', 'aria-pressed="true">Atas dock</button>'),
    ('aria-pressed="false">On Rover</button>', 'aria-pressed="false">Atas Rover</button>'),
    ('aria-pressed="false">With Board</button>', 'aria-pressed="false">Dengan Board</button>'),
    ('id="moveBtn" aria-pressed="false">Test movement</button>', 'id="moveBtn" aria-pressed="false">Uji gerakan</button>'),
    ('<h2 id="s1">1. Look</h2>', '<h2 id="s1">1. Rupa</h2>'),
    ('<h2 id="s2">2. Colour</h2>', '<h2 id="s2">2. Warna</h2>'),
    ('<h2 id="s3">3. Charging dock</h2><span id="dockPrice">Included</span>', '<h2 id="s3">3. Dock pengecas</h2><span id="dockPrice">Termasuk</span>'),
    ('<h2 id="s4">4. Engraving</h2><span>Free</span>', '<h2 id="s4">4. Ukiran</h2><span>Percuma</span>'),
    ('<label for="name" class="small">Your companion\'s name</label>', '<label for="name" class="small">Nama teman anda</label>'),
    ('placeholder="e.g. Kront"', 'placeholder="cth. Kront"'),
    ('<span id="nameHelp" class="small muted">Up to 10 letters or numbers. Engraved on the dock after the word NURI; choose a dock above to see it in 3D.</span>', '<span id="nameHelp" class="small muted">Sehingga 10 huruf atau nombor. Diukir pada dock selepas perkataan NURI; pilih dock di atas untuk lihat dalam 3D.</span>'),
    ('aria-label="Engraving preview"', 'aria-label="Pratonton ukiran"'),
    ('<h2 id="s5">5. Add-ons</h2><span>Optional</span>', '<h2 id="s5">5. Add-on</h2><span>Pilihan</span>'),
    ('<small>Tracked base so NURI can move around</small></span><span class="tbc">Price TBA</span>', '<small>Tapak berantai supaya NURI boleh bergerak</small></span><span class="tbc">Harga akan diumumkan</span>'),
    ('<small>10" teaching screen on a stand</small></span><span class="tbc">Price TBA</span>', '<small>Skrin pengajaran 10" atas stand</small></span><span class="tbc">Harga akan diumumkan</span>'),
    ('<h2 id="s6" style="font-size:20px;margin-bottom:14px">Summary</h2>', '<h2 id="s6" style="font-size:20px;margin-bottom:14px">Ringkasan</h2>'),
    ('<div class="total"><span class="muted">Target price</span>', '<div class="total"><span class="muted">Harga sasaran</span>'),
    ('</svg>Register interest on WhatsApp</a>', '</svg>Daftar minat di WhatsApp</a>'),
    ('id="copy" style="margin-top:10px">Copy my configuration</button>', 'id="copy" style="margin-top:10px">Salin konfigurasi saya</button>'),
    ('<p class="small muted" style="margin-top:12px">Orders are not open yet and no payment is taken. The WhatsApp button opens a chat with your configuration filled in; nothing is sent until you press send.</p>', '<p class="small muted" style="margin-top:12px">Tempahan belum dibuka dan tiada bayaran diambil. Butang WhatsApp membuka chat dengan konfigurasi anda sudah diisi; tiada apa dihantar sehingga anda tekan hantar.</p>'),
    ('<a href="./">NURI</a>', '<a href="./">NURI</a>'),
    ('3D preview of the planned design, proportioned from M5Stack\'s published K151 structure files. Not affiliated with M5Stack.', 'Pratonton 3D reka bentuk yang dirancang, berkadar dengan fail struktur K151 yang diterbitkan M5Stack. Tiada kaitan dengan M5Stack.'),
]

SKIP = ('http', '#', 'mailto:', 'tel:', 'data:', '/')


def localise(html, page, pairs):
    missing = [en for en, _ in pairs if en not in html]
    if missing:
        sys.exit(f'{page}: English text changed, update tools/build-ms.py:\n  ' + '\n  '.join(m[:90] for m in missing))
    for en, ms in pairs:
        html = html.replace(en, ms)
    html = html.replace('<html lang="en">', '<html lang="ms">', 1)
    # language toggle: BM is current, EN links back
    html = re.sub(r'<div class="lang-toggle"[^>]*>.*?</div>',
                  f'<div class="lang-toggle" role="group" aria-label="Language / Bahasa"><a class="lang-switch" href="../{"" if page == "index.html" else page}" hreflang="en" lang="en">EN</a><span class="lang-on" aria-current="true">BM</span></div>', html, count=1)
    # canonical and og:url point at the BM page
    url = 'https://ciptarobo.com/ms/' + ('' if page == 'index.html' else page)
    html = re.sub(r'<link rel="canonical" href="[^"]+">', f'<link rel="canonical" href="{url}">', html, count=1)
    html = re.sub(r'<meta property="og:url" content="[^"]+">', f'<meta property="og:url" content="{url}">', html, count=1)
    html = html.replace('<meta property="og:type" content="website">', '<meta property="og:type" content="website">\n<meta property="og:locale" content="ms_MY">', 1)

    # the BM pages live in /ms/: point shared files one folder up
    def fix(m):
        attr, val = m.group(1), m.group(2)
        if val.startswith(SKIP) or val in ('./', 'configure.html') or val.startswith('../') or (attr == 'href' and val.startswith('?')):
            return m.group(0)
        return f'{attr}="../{val}"'
    head, sep, rest = html.partition('<body>')
    html = re.sub(r'\b(src|href)="([^"]+)"', fix, head) + sep + re.sub(r'\b(src|href)="([^"]+)"', fix, rest)
    html = html.replace('"./vendor/three/', '"../vendor/three/')
    return html


os.makedirs(os.path.join(ROOT, 'ms'), exist_ok=True)
for page, pairs in (('index.html', INDEX), ('configure.html', CONFIGURE)):
    src = open(os.path.join(ROOT, page), encoding='utf-8').read()
    out = localise(src, page, COMMON + pairs)
    out = out.replace('<!doctype html>', '<!doctype html>\n<!-- Generated by tools/build-ms.py from ../' + page + '. Edit the English page and the translations, not this file. -->', 1)
    open(os.path.join(ROOT, 'ms', page), 'w', encoding='utf-8').write(out)
    print('wrote ms/' + page)
