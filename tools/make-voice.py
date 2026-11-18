"""Generate NURI scene voice tracks with Kokoro TTS and a JS timing module."""
# Usage: pip install kokoro-onnx soundfile; download kokoro-v1.0.int8.onnx (saved as kokoro.onnx) and voices-v1.0.bin from
# github.com/thewh1teagle/kokoro-onnx releases into DIR, then: python3 tools/make-voice.py DIR  (needs ffmpeg)
import json, subprocess, sys, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
V = sys.argv[1]; OUT = __import__('os').path.join(__import__('os').path.dirname(__file__), '..', 'assets') + '/'
k = Kokoro(V + '/kokoro.onnx', V + '/voices-v1.0.bin')
VOICE = {
 'en': {'NURI': ('af_heart', 1.0, 'en-us'), 'Student': ('af_sky', 1.02, 'en-us'), 'Customer': ('am_michael', 1.0, 'en-us'),
        'You': ('am_eric', 1.0, 'en-us'), 'Mak Su': ('bf_emma', .92, 'en-gb')},
 # Bahasa Melayu: Kokoro voices driven by espeak-ng Malay phonemes (lang 'ms')
 'ms': {'NURI': ('if_sara', 1.0, 'ms'), 'Pelajar': ('ef_dora', 1.04, 'ms'), 'Pelanggan': ('im_nicola', 1.0, 'ms'),
        'Anda': ('pm_alex', 1.0, 'ms'), 'Mak Su': ('pf_dora', .92, 'ms')},
}
# (speaker, caption text, spoken text or None, pause before in s)
SCRIPT = {'en': {
 'learn': [('NURI', "Let's solve it together. What should we do with the +3?", "Let's solve it together. What should we do with the plus three?", .6),
           ('Student', 'Move it to the other side?', None, .45),
           ('NURI', 'Exactly. 11 − 3 gives us 2x = 8.', 'Exactly. Eleven minus three gives us, two x equals eight.', .35),
           ('NURI', 'Now divide both sides by 2. So x = 4. Well done!', 'Now divide both sides by two. So x equals four. Well done!', .5)],
 'reception': [('NURI', 'Hi, welcome in! Would you like to take a number?', None, .6),
               ('Customer', 'Yes, please.', None, .4),
               ('NURI', "You're A012. It's about five minutes.", "You're A, zero twelve. It's about five minutes.", .35),
               ('NURI', "I've let the staff know you're here. Have a seat!", None, .45)],
 'assist': [('You', 'NURI, what matters most today?', 'Nuri, what matters most today?', .6),
            ('NURI', 'Three things. Your 9:30 client call comes first.', 'Three things. Your nine thirty client call comes first.', .4),
            ('NURI', 'Then quotation #24. The draft is ready on your laptop.', 'Then quotation twenty four. The draft is ready on your laptop.', .3),
            ('You', 'Great, show me.', None, .4),
            ('NURI', "It's open. I won't send anything until you say so.", None, .35)],
 'companion': [('NURI', 'Good evening, Mak Su. Have you taken your 9 pm medicine?', 'Good evening, Mak Soo. Have you taken your nine p.m. medicine?', .6),
               ('Mak Su', 'Yes, just now.', None, .45),
               ('NURI', 'Great. Shall I call Aisyah to say goodnight?', 'Great. Shall I call Ai-sha to say goodnight?', .35),
               ('Mak Su', 'Yes, please.', None, .4),
               ('NURI', 'Calling Aisyah now…', 'Calling Ai-sha now.', .35)],
}, 'ms': {
 'learn': [('NURI', 'Jom kita selesaikan sama-sama. Apa kita nak buat dengan +3 ni?', 'Jom kita selesaikan sama-sama. Apa kita nak buat dengan tambah tiga ni?', .6),
           ('Pelajar', 'Pindahkan ke sebelah sana?', None, .45),
           ('NURI', 'Betul. 11 − 3, jadi 2x = 8.', 'Betul. Sebelas tolak tiga, jadi dua eks sama dengan lapan.', .35),
           ('NURI', 'Sekarang bahagi kedua-dua belah dengan 2. Jadi x = 4. Bagus!', 'Sekarang bahagi kedua-dua belah dengan dua. Jadi eks sama dengan empat. Bagus!', .5)],
 'reception': [('NURI', 'Hai, selamat datang! Nak ambil nombor giliran?', None, .6),
               ('Pelanggan', 'Ya, boleh.', None, .4),
               ('NURI', 'Nombor anda A012. Lebih kurang lima minit.', 'Nombor anda, ei kosong satu dua. Lebih kurang lima minit.', .35),
               ('NURI', 'Saya dah maklumkan staf. Silakan duduk dulu!', None, .45)],
 'assist': [('Anda', 'NURI, apa yang paling penting hari ni?', 'Nuri, apa yang paling penting hari ni?', .6),
            ('NURI', 'Tiga perkara. Panggilan klien pukul 9:30 paling utama.', 'Tiga perkara. Panggilan klien pukul sembilan setengah paling utama.', .4),
            ('NURI', 'Lepas tu sebut harga #24. Draf dah siap dalam laptop anda.', 'Lepas tu, sebut harga dua puluh empat. Draf dah siap dalam laptop anda.', .3),
            ('Anda', 'Okey, tunjuk saya.', None, .4),
            ('NURI', 'Dah dibuka. Saya takkan hantar apa-apa sampai anda setuju.', None, .35)],
 'companion': [('NURI', 'Selamat malam, Mak Su. Mak Su dah makan ubat pukul 9 malam?', 'Selamat malam, Mak Su. Mak Su dah makan ubat pukul sembilan malam?', .6),
               ('Mak Su', 'Dah, baru tadi.', None, .45),
               ('NURI', 'Bagus. Nak saya telefon Aisyah, ucap selamat malam?', None, .35),
               ('Mak Su', 'Boleh juga.', None, .4),
               ('NURI', 'Okey, saya telefon Aisyah sekarang…', 'Okey, saya telefon Aisyah sekarang.', .35)],
}}
SR = 24000; FPS = 30; data = {}
for lang, scenes in SCRIPT.items():
  data[lang] = {}
  for sid, lines in scenes.items():
      track, nuri, cues, t = [], [], [], 0.0
      for who, cap, spoken, pause in lines:
          v, sp, code = VOICE[lang][who]
          a, sr = k.create(spoken or cap, voice=v, speed=sp, lang=code); assert sr == SR
          a = a.astype(np.float32)
          nz = np.where(np.abs(a) > .01)[0]; a = a[max(0, nz[0] - 240): nz[-1] + 1200]  # trim silence
          gap = np.zeros(int(pause * SR), np.float32); track += [gap, a]
          nuri += [gap, a if who == 'NURI' else np.zeros_like(a)]
          t += pause; cues.append({'who': who, 'text': cap, 'start': round(t, 2), 'end': round(t + len(a) / SR, 2)}); t += len(a) / SR
      tail = np.zeros(int(1.6 * SR), np.float32); track.append(tail); nuri.append(tail)
      y = np.concatenate(track); yn = np.concatenate(nuri)
      peak = np.max(np.abs(y)); y = y / peak * .89
      sf.write('/tmp/_v.wav', y, SR)
      subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', '/tmp/_v.wav', '-ac', '1', '-ar', '24000', '-c:a', 'libmp3lame', '-b:a', '48k', OUT + f'audio/scene-{sid}' + ('' if lang == 'en' else '-' + lang) + '.mp3'], check=True)
      hop = SR // FPS; n = len(yn) // hop
      rms = np.sqrt(np.mean(yn[:n * hop].reshape(n, hop) ** 2, axis=1)); rms = rms / (rms.max() or 1)
      env = ''.join(str(min(9, int(round(x ** .6 * 9)))) for x in rms)
      data[lang][sid] = {'duration': round(len(y) / SR, 2), 'cues': cues, 'env': env}
      print(lang, sid, data[lang][sid]['duration'], [c['start'] for c in cues])
with open(OUT + 'scene-voice.js', 'w') as f:
    f.write('/* Generated by the voice build script: NURI scene voice timings (Kokoro TTS). Do not edit by hand. */\n')
    f.write('export const VOICE_FPS = %d;\nexport const VOICE = %s;\n' % (FPS, json.dumps(data, ensure_ascii=False, separators=(',', ':'))))
