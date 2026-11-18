"""Bahasa Melayu scene lines with Chatterbox Multilingual (MIT licence), which sounds far more natural in Malay than Kokoro.

Usage (in an environment with chatterbox-tts and faster-whisper installed):  python tools/make-voice-ms.py DIR [scene ...]
DIR holds reference clips ref_<voice>.wav for the people in the scenes (any voice you have the rights to; we use Kokoro voices).
Each line is generated several times; Whisper transcribes every take, the closest match to the script wins, and anything
after the last spoken word is trimmed. Writes DIR/ms-lines/<scene>-<n>.wav; then run tools/make-voice.py DIR.
"""
import os, re, sys, difflib, numpy as np, torch, torchaudio as ta
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from voice_script import SCRIPT
from chatterbox.mtl_tts import ChatterboxMultilingualTTS
from faster_whisper import WhisperModel

V = sys.argv[1]; OUT = os.path.join(V, 'ms-lines'); os.makedirs(OUT, exist_ok=True)
torch.set_num_threads(os.cpu_count() or 4)
try: model = ChatterboxMultilingualTTS.from_pretrained(device='cpu', t3_model='v3')
except TypeError: model = ChatterboxMultilingualTTS.from_pretrained(device='cpu')
asr = WhisperModel('small', device='cpu', compute_type='int8')
# NURI uses the model's own default voice; the people get distinct reference voices.
REF = {'NURI': None, 'Pelajar': 'ref_af_sky.wav', 'Pelanggan': 'ref_am_michael.wav', 'Anda': 'ref_am_eric.wav', 'Mak Su': 'ref_bf_emma.wav'}
NUM = {'0': 'kosong', '1': 'satu', '2': 'dua', '3': 'tiga', '4': 'empat', '5': 'lima', '8': 'lapan', '9': 'sembilan', '11': 'sebelas', '24': 'dua puluh empat'}

def norm(t):
    t = re.sub(r'\d+', lambda m: ' ' + NUM.get(m.group(), m.group()) + ' ', t.lower())
    return re.sub(r'[^a-z ]', ' ', t).split()

def take(text, who, seed):
    torch.manual_seed(seed)
    kw = dict(language_id='ms', cfg_weight=0.0, exaggeration=.5 if who == 'NURI' else .45)
    if REF[who]: kw['audio_prompt_path'] = os.path.join(V, REF[who])
    wav = model.generate(text, **kw)[0].numpy()
    x = np.interp(np.arange(0, len(wav), model.sr / 16000), np.arange(len(wav)), wav).astype(np.float32)
    segs = list(asr.transcribe(x, language='ms', beam_size=5, word_timestamps=True)[0])
    heard = ' '.join(s.text for s in segs); words = [w for s in segs for w in (s.words or [])]
    score = difflib.SequenceMatcher(None, ' '.join(norm(text)), ' '.join(norm(heard))).ratio()
    if words:   # cut whatever follows the last word (tail noise or babble), with a short fade
        end = min(len(wav), int((words[-1].end + .3) * model.sr)); wav = wav[:end].copy()
        f = int(.08 * model.sr); wav[-f:] *= np.linspace(1, 0, f)
    return score, heard.strip(), wav

only = sys.argv[2:]
for sid, lines in SCRIPT['ms'].items():
    if only and sid not in only: continue
    for n, (who, cap, spoken, pause) in enumerate(lines):
        text = (spoken or cap).replace('…', '.')
        best = None
        for seed in range(6):
            r = take(text, who, 11 + seed * 97)
            if not best or r[0] > best[0]: best = r
            if r[0] >= .93: break
        ta.save(os.path.join(OUT, f'{sid}-{n}.wav'), torch.from_numpy(best[2])[None], model.sr)
        print(f'{sid}-{n} {who:9s} score={best[0]:.2f} | {best[1]}', flush=True)
