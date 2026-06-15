import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { submitComplaint } from '../utils/firestoreService';
import { CATEGORIES, WARDS, getNearestWard } from '../utils/dummyData';
import { verifyImageClient } from '../utils/imageVerify';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  Upload, MapPin, Mic, MicOff, Send, X,
  ShieldCheck, ShieldAlert, Loader, Lock, Navigation, AlertCircle, Bot, Tag
} from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const MapController = ({ location }) => {
  const map = useMap();
  useEffect(() => {
    if (location) map.flyTo([location.lat, location.lng], 16, { duration: 1.2 });
  }, [location, map]);
  return null;
};

const LocationPicker = ({ onSelect, locked }) => {
  useMapEvents({ click: (e) => { if (!locked) onSelect({ lat: e.latlng.lat, lng: e.latlng.lng }); } });
  return null;
};

const useVoice = ({ onResult }) => {
  const recRef = useRef(null);
  const [active, setActive]   = useState(false);
  const [interim, setInterim] = useState('');

  const start = useCallback((field) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast.error('Voice input not supported in this browser'); return; }
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = 'en-IN';
    rec.onresult = (e) => {
      let fin = '', tmp = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        e.results[i].isFinal ? (fin += t) : (tmp += t);
      }
      if (tmp) setInterim(tmp);
      if (fin) { setInterim(''); onResult(field, fin.trim()); }
    };
    rec.onerror = (e) => { if (e.error !== 'no-speech') toast.error(`Voice error: ${e.error}`); setActive(false); setInterim(''); };
    rec.onend   = () => { setActive(false); setInterim(''); };
    rec.start(); recRef.current = rec; setActive(true);
  }, [onResult]);

  const stop   = useCallback(() => { recRef.current?.stop(); setActive(false); setInterim(''); }, []);
  const toggle = useCallback((field) => { active ? stop() : start(field); }, [active, start, stop]);
  return { active, interim, toggle };
};

export default function SubmitComplaint() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]                 = useState({ title: '', description: '', category: '', ward: '' });
  const [location, setLocation]         = useState(null);
  const [gpsLocked, setGpsLocked]       = useState(false);
  const [image, setImage]               = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [verifying, setVerifying]       = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [loading, setLoading]           = useState(false);
  const [voiceField, setVoiceField]     = useState('description');
  const imgElRef = useRef(null);

  const setField = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const { active: listening, interim, toggle: toggleVoice } = useVoice({
    onResult: (field, text) => {
      const lower = text.toLowerCase();
      if (lower.startsWith('set title ')) {
        setForm((p) => ({ ...p, title: text.slice(10).trim() }));
        toast.success('Title set via voice');
      } else if (lower.startsWith('set category ')) {
        const val   = text.slice(13).trim();
        const match = CATEGORIES.find((c) => c.toLowerCase().includes(val.toLowerCase()));
        if (match) { setForm((p) => ({ ...p, category: match })); toast.success(`Category: ${match}`); }
        else toast.error(`Category "${val}" not found`);
      } else {
        setForm((p) => ({ ...p, [field]: p[field] ? p[field] + ' ' + text : text }));
        toast.success(`🎙️ Added to ${field}`);
      }
    },
  });

  const getCurrentLocation = () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported');
    toast.loading('Getting your location...', { id: 'gps' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        setLocation({ lat, lng });
        setGpsLocked(true);
        const ward = getNearestWard(lat, lng);
        setForm((p) => ({ ...p, ward }));
        toast.success(`📍 GPS locked — ${ward}`, { id: 'gps' });
      },
      () => toast.error('Could not get location', { id: 'gps' })
    );
  };

  // Run verification using canvas analysis
  const runVerification = useCallback(async (file, imgEl, category) => {
    if (!imgEl) return;
    setVerifying(true);
    const result = await verifyImageClient(file, imgEl, category);
    setVerifyResult(result);
    setVerifying(false);
    if (result.status === 'NOT_REAL')
      toast.error(`⚠️ ${result.message}`);
    else if (result.status === 'NOT_RELEVANT')
      toast.error('⚠️ Image does not match the complaint category');
    else if (!result.fallback)
      toast.success('✔ Image verified successfully');
  }, []);

  // Re-run when category changes after image is already loaded
  useEffect(() => {
    if (image && imgElRef.current && form.category) {
      runVerification(image, imgElRef.current, form.category);
    }
  }, [form.category]); // eslint-disable-line

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be under 5MB');
    if (!file.type.startsWith('image/')) return toast.error('Please upload an image file');
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    setVerifyResult(null);
    imgElRef.current = null;
  };

  // Called when <img> finishes loading — triggers canvas analysis
  const onImgLoad = (e) => {
    imgElRef.current = e.target;
    runVerification(image, e.target, form.category);
  };

  const removeImage = (e) => {
    e.preventDefault();
    setImage(null); setImagePreview(null); setVerifyResult(null); imgElRef.current = null;
  };

  const CATEGORY_KEYWORDS = {
    Accident:      ['accident', 'crash', 'collision', 'injury', 'hit', 'vehicle', 'road', 'speed', 'signal'],
    Fire:          ['fire', 'burn', 'flame', 'smoke', 'blaze', 'burning', 'firefighter'],
    Flood:         ['flood', 'water', 'rain', 'overflow', 'waterlog', 'drainage', 'drain', 'submerge'],
    'Power Outage':['power', 'electricity', 'electric', 'light', 'current', 'outage', 'blackout', 'transformer', 'wire'],
    Pollution:     ['pollution', 'smoke', 'dust', 'waste', 'chemical', 'toxic', 'air', 'smell', 'odor', 'factory', 'emission'],
    'Road Damage': ['road', 'pothole', 'crack', 'damage', 'broken', 'pavement', 'footpath', 'divider', 'street'],
    'Water Supply':['water', 'supply', 'pipe', 'leak', 'sewage', 'drain', 'tap', 'shortage', 'contaminate'],
    Garbage:       ['garbage', 'waste', 'trash', 'dump', 'litter', 'bin', 'clean', 'sweeping', 'sanitation'],
    Noise:         ['noise', 'sound', 'loud', 'music', 'horn', 'disturbance', 'night', 'party'],
    Other:         [],
  };

  const validateText = () => {
    const title = form.title.trim();
    const desc  = form.description.trim();
    const combined = (title + ' ' + desc).toLowerCase();

    // Title checks
    if (title.length < 10) return 'Title must be at least 10 characters';
    const titleWords = title.split(/\s+/).filter(Boolean);
    if (titleWords.length < 3) return 'Title must have at least 3 words';
    const hasRepeatChars = /^(.)\1{3,}$/i.test(title.replace(/\s/g, ''));
    if (hasRepeatChars) return 'Please enter a meaningful complaint title';
    const randomChars = /^[^aeiou\s]{6,}$/i.test(title.replace(/\s/g, ''));
    if (randomChars) return 'Title does not look like a real complaint';
    const fakeWords = /^(test|fake|abc|xyz|asdf|qwerty|hello|hi|dummy|sample|random|blah|lol|idk)$/i;
    if (titleWords.every(w => fakeWords.test(w))) return 'Please enter a meaningful complaint title';

    // Description checks
    if (desc.length < 20) return 'Description must be at least 20 characters';
    const uniqueWords = new Set(desc.toLowerCase().split(/\s+/));
    if (uniqueWords.size < 4) return 'Please provide a more detailed description';

    // Category match check
    if (form.category && form.category !== 'Other') {
      const keywords = CATEGORY_KEYWORDS[form.category] || [];
      const matches  = keywords.filter(k => combined.includes(k));
      if (matches.length === 0)
        return `Your title/description doesn't match the "${form.category}" category. Please describe the actual issue.`;
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category) return toast.error('Please select a category');
    if (!location)      return toast.error('Please use GPS or click the map to set location');
    const textError = validateText();
    if (textError) return toast.error(textError);
    if (verifyResult?.status === 'NOT_REAL')
      return toast.error('Cannot submit — please upload a real photo of the issue.');
    if (verifyResult?.status === 'NOT_RELEVANT')
      return toast.error('Cannot submit — image does not match the complaint category.');

    setLoading(true);
    try {
      await submitComplaint(
        { ...form, location, imageVerification: verifyResult ? { status: verifyResult.status, isRealPhoto: verifyResult.isRealPhoto, isRelevant: verifyResult.isRelevant, verifiedAt: new Date().toISOString() } : null },
        image, user.uid, user.displayName || user.email, user.email
      );
      toast.success('✅ Complaint submitted successfully!');
      navigate('/history');
    } catch (err) {
      toast.error('Failed to submit: ' + err.message);
    } finally { setLoading(false); }
  };

  const blocked = verifyResult?.status === 'NOT_REAL' || verifyResult?.status === 'NOT_RELEVANT';

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header">
          <h1>Submit a Complaint</h1>
          <p>AI verifies your image is real and matches your complaint — then auto-prioritizes it</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid-2" style={{ gap: 24 }}>

            {/* LEFT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="card">
                <div className="section-title">📝 Complaint Details</div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Title *</span>
                    <VoiceBtn active={listening && voiceField === 'title'} onClick={() => { setVoiceField('title'); toggleVoice('title'); }} />
                  </label>
                  <input className="form-input" placeholder="Brief title of the issue" value={form.title} onChange={setField('title')} required />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Description *</span>
                    <VoiceBtn active={listening && voiceField === 'description'} onClick={() => { setVoiceField('description'); toggleVoice('description'); }} />
                  </label>
                  <textarea className="form-textarea" placeholder="Describe the issue in detail..." value={form.description} onChange={setField('description')} required />
                  {listening && (
                    <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <VoiceWave />
                        <span style={{ fontSize: 11, color: '#3b82f6', fontWeight: 600 }}>Listening — <strong>{voiceField}</strong></span>
                      </div>
                      {interim && <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>"{interim}"</div>}
                      <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>💡 Say <em>"set title …"</em> or <em>"set category Road Damage"</em></div>
                    </div>
                  )}
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select className="form-select" value={form.category} onChange={setField('category')} required>
                      <option value="">Select category</option>
                      {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ward</label>
                    <select className="form-select" value={form.ward} onChange={setField('ward')}>
                      <option value="">Select ward</option>
                      {WARDS.map((w) => <option key={w}>{w}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Image Upload */}
              <div className="card">
                <div className="section-title"><Upload size={16} /> Upload Image</div>
                <label className="upload-area" style={{ display: 'block', cursor: image ? 'default' : 'pointer' }}>
                  {imagePreview ? (
                    <div style={{ position: 'relative' }}>
                      <img src={imagePreview} alt="preview" onLoad={onImgLoad}
                        style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 8,
                          border: `2px solid ${verifyResult ? (verifyResult.status === 'VERIFIED' ? '#22c55e' : '#ef4444') : '#334155'}`,
                          transition: 'border-color 0.3s' }} />
                      <button type="button" onClick={removeImage}
                        style={{ position: 'absolute', top: 8, right: 8, background: '#ef4444', border: 'none', borderRadius: '50%', width: 26, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={13} color="white" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload size={32} color="#475569" style={{ margin: '0 auto 8px' }} />
                      <div style={{ fontSize: 14, color: '#64748b' }}>Click to upload image</div>
                      <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>PNG, JPG up to 5MB — AI checks if it's real and relevant</div>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                </label>

                {verifying && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, padding: '10px 14px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8 }}>
                    <Loader size={15} color="#3b82f6" style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, color: '#3b82f6', fontWeight: 600 }}>AI is analysing your image...</div>
                      <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>Checking: real photo · document detection · category match</div>
                    </div>
                  </div>
                )}

                {!verifying && verifyResult && <VerificationResult result={verifyResult} />}
              </div>
            </div>

            {/* RIGHT — Map */}
            <div className="card">
              <div className="section-title"><MapPin size={16} /> Location *</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
                {!gpsLocked ? (
                  <button type="button" className="btn btn-primary btn-sm" onClick={getCurrentLocation}>
                    <Navigation size={14} /> Use My GPS Location
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8 }}>
                    <Lock size={13} color="#22c55e" />
                    <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>GPS Locked</span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>{location.lat.toFixed(5)}, {location.lng.toFixed(5)}</span>
                    <button type="button" onClick={() => { setGpsLocked(false); setLocation(null); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0, display: 'flex' }}>
                      <X size={13} />
                    </button>
                  </div>
                )}
                {!gpsLocked && location && <span style={{ fontSize: 12, color: '#94a3b8' }}>📍 {location.lat.toFixed(5)}, {location.lng.toFixed(5)}</span>}
              </div>

              <div style={{ height: 380, borderRadius: 8, overflow: 'hidden', border: `1px solid ${gpsLocked ? '#22c55e55' : '#334155'}`, position: 'relative', transition: 'border-color 0.3s' }}>
                <MapContainer center={[13.0604, 80.2496]} zoom={12} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                  <MapController location={location} />
                  <LocationPicker onSelect={(loc) => { setLocation(loc); setGpsLocked(false); }} locked={gpsLocked} />
                  {location && <Marker position={[location.lat, location.lng]} />}
                </MapContainer>
                {gpsLocked && (
                  <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000, display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: 'rgba(15,23,42,0.85)', border: '1px solid #22c55e55', borderRadius: 8 }}>
                    <Lock size={11} color="#22c55e" />
                    <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 600 }}>GPS Locked</span>
                  </div>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
                {gpsLocked ? '🔒 Location locked from GPS. Click ✕ to unlock and pick manually.' : '💡 Click "Use My GPS Location" or click the map to pin the location.'}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center' }}>
            {blocked && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#ef4444' }}>
                <ShieldAlert size={14} />
                {verifyResult?.status === 'NOT_REAL' ? 'Not a real photo — cannot submit' : 'Image not relevant — cannot submit'}
              </div>
            )}
            <button type="button" className="btn btn-outline" onClick={() => navigate('/dashboard')}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading || blocked || verifying}>
              <Send size={16} /> {loading ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

const VerificationResult = ({ result }) => {
  const ok     = result.status === 'VERIFIED';
  const color  = ok ? '#22c55e' : '#ef4444';
  const bg     = ok ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)';
  const border = ok ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)';

  return (
    <div style={{ marginTop: 12, padding: 14, borderRadius: 8, background: bg, border: `1px solid ${border}`, boxShadow: `0 0 14px ${ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        {ok ? <ShieldCheck size={16} color="#22c55e" /> : <ShieldAlert size={16} color="#ef4444" />}
        <span style={{ fontWeight: 700, fontSize: 13, color }}>
          {ok ? '✔ Image Verified' : result.status === 'NOT_REAL' ? '✘ Not a Real Photo' : '✘ Image Does Not Match Category'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
        <CheckRow icon={<Bot size={13} />} label="Real Photo Check" pass={result.isRealPhoto}
          detail={result.isRealPhoto
            ? `Real photo confirmed (entropy: ${result.entropy})`
            : result.realIssues?.[0] || 'Not a real photo'} />
        <CheckRow icon={<Tag size={13} />} label="Matches Complaint Category" pass={result.isRelevant}
          detail={result.relevanceMsg} />
      </div>

      {result.dominantColors?.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Dominant colours in image:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {result.dominantColors.map((l, i) => (
              <span key={i} style={{ fontSize: 11, padding: '2px 8px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', borderRadius: 4, border: '1px solid rgba(59,130,246,0.2)' }}>{l}</span>
            ))}
          </div>
        </div>
      )}

      {!ok && !result.fallback && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertCircle size={12} /> {result.message}
        </div>
      )}
    </div>
  );
};

const CheckRow = ({ icon, label, pass, detail }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 10px', background: 'rgba(0,0,0,0.15)', borderRadius: 6 }}>
    <span style={{ color: pass ? '#22c55e' : '#ef4444', marginTop: 1, flexShrink: 0 }}>{icon}</span>
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9' }}>{label}</span>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: pass ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)', color: pass ? '#22c55e' : '#ef4444' }}>
          {pass ? 'PASS' : 'FAIL'}
        </span>
      </div>
      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{detail}</div>
    </div>
  </div>
);

const VoiceBtn = ({ active, onClick }) => (
  <button type="button" onClick={onClick}
    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, transition: 'all 0.2s',
      background: active ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.12)', color: active ? '#ef4444' : '#3b82f6', boxShadow: active ? '0 0 8px rgba(239,68,68,0.3)' : 'none' }}>
    {active ? <MicOff size={11} /> : <Mic size={11} />}
    {active ? 'Stop' : 'Voice'}
  </button>
);

const VoiceWave = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 16 }}>
    {[1,2,3,4,3].map((h, i) => (
      <div key={i} style={{ width: 3, borderRadius: 2, background: '#3b82f6', height: `${h*4}px`, animation: `voiceBar 0.6s ease-in-out ${i*0.1}s infinite alternate` }} />
    ))}
    <style>{`@keyframes voiceBar{from{transform:scaleY(0.4);opacity:0.5}to{transform:scaleY(1.4);opacity:1}}`}</style>
  </div>
);
