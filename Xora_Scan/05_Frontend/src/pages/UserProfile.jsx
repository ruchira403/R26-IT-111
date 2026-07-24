import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth, getStoredToken } from '../auth/useAuth';
import { getMe } from '../auth/authApi';
import { useNavigate } from 'react-router-dom';
import { AUTH_API_BASE_URL } from '../auth/authConfig';

export default function UserProfile() {
  const { user, clearAuth } = useAuth();
  const navigate = useNavigate();
  const [profileLoading, setProfileLoading] = useState(true);
  const [latestProfile, setLatestProfile] = useState(null);
  const [healthProfiles, setHealthProfiles] = useState([]);
  const [dentalHistory, setDentalHistory] = useState([]);
  const [expandedProfileId, setExpandedProfileId] = useState(null);
  const [expandedRecordId, setExpandedRecordId] = useState(null);

  const formatValue = (value) => {
    if (value === null || value === undefined || value === '') return '—';
    if (value === true) return 'Yes';
    if (value === false) return 'No';
    return value;
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (/^https?:\/\//i.test(imagePath) || imagePath.startsWith('data:')) return imagePath;
    if (imagePath.startsWith('/')) return `${AUTH_API_BASE_URL}${imagePath}`;
    return `${AUTH_API_BASE_URL}/${imagePath}`;
  };

  useEffect(() => {
    const load = async () => {
      setProfileLoading(true);
      try {
        const token = getStoredToken();
        if (!token) {
          clearAuth();
          navigate('/login');
          return;
        }
        const resp = await getMe(token);
        const data = resp?.data || resp;
        setLatestProfile(data.latestHealthProfile || null);
        setHealthProfiles(data.healthProfiles || []);
        setDentalHistory(data.dentalHistory || []);
      } catch (err) {
        console.error('Failed to load profile', err);
        const status = err?.response?.status;
        if (status === 401) {
          clearAuth();
          navigate('/login');
        }
      } finally {
        setProfileLoading(false);
      }
    };
    load();
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <Header />
      <main className="flex-grow max-w-4xl mx-auto px-4 py-12 w-full">
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-bold text-slate-900">Profile</h2>
            <p className="text-sm text-slate-500">Account: {user?.email}</p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-xs text-slate-400">Latest Health Profile</div>
                {profileLoading ? (
                  <div className="text-sm text-slate-500 mt-2">Loading...</div>
                ) : latestProfile ? (
                  <div className="mt-2 text-sm text-slate-700 space-y-1">
                    <div>Age: {latestProfile.age}</div>
                    <div>Teeth: {latestProfile.numberOfTeeth}</div>
                    <div>Missing: {latestProfile.numberOfMissingTeeth}</div>
                    <div>Hygiene: {latestProfile.overallOralHygieneLevel}</div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 mt-2">No saved profile</div>
                )}
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-xs text-slate-400">Account Details</div>
                <div className="mt-2 text-sm text-slate-700 space-y-1">
                  <div>ID: {user?.id}</div>
                  <div>Email: {user?.email}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Saved Health Profiles</h3>
            {healthProfiles.length === 0 && <div className="text-sm text-slate-500">No saved records</div>}
            <div className="divide-y divide-slate-100">
              {healthProfiles.map((hp) => {
                const profileRows = [
                  { label: 'Age', value: hp.age },
                  { label: 'Sugar usage', value: hp.sugarUsage },
                  { label: 'Gum bleeding', value: hp.gumBleeding },
                  { label: 'Alcohol usage', value: hp.alcoholUsage },
                  { label: 'Smoking status', value: hp.smokingStatus },
                  { label: 'Diabetes status', value: hp.diabetesStatus },
                  { label: 'Number of teeth', value: hp.numberOfTeeth },
                  { label: 'Primary teeth', value: hp.isPrimaryTeeth },
                  { label: 'Pregnancy status', value: hp.pregnancyStatus },
                  { label: 'Tooth sensitivity', value: hp.toothSensitivity },
                  { label: 'Brushing frequency', value: hp.brushingFrequency },
                  { label: 'Preferred language', value: hp.preferredLanguage },
                  { label: 'Filled teeth', value: hp.numberOfFilledTeeth },
                  { label: 'Missing teeth', value: hp.numberOfMissingTeeth },
                  { label: 'Oral hygiene', value: hp.overallOralHygieneLevel },
                ];

                return (
                  <div key={hp.id} className="py-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="text-sm text-slate-700">
                        <div className="font-medium">{new Date(hp.createdAt).toLocaleString()}</div>
                        <div className="text-xs text-slate-500">Age: {hp.age} — Teeth: {hp.numberOfTeeth}</div>
                      </div>
                      <button
                        onClick={() => setExpandedProfileId(expandedProfileId === hp.id ? null : hp.id)}
                        className="px-3 py-1 text-sm rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100"
                      >
                        {expandedProfileId === hp.id ? 'Hide' : 'View'}
                      </button>
                    </div>

                    {expandedProfileId === hp.id && (
                      <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {profileRows.map((row) => (
                            <div key={row.label} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                              <div className="text-[11px] uppercase tracking-wide text-slate-400">{row.label}</div>
                              <div className="mt-1 text-sm text-slate-700">{formatValue(row.value)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Dental Records & Detected Diseases</h3>
            {dentalHistory.length === 0 && <div className="text-sm text-slate-500">No saved dental records</div>}
            <div className="divide-y divide-slate-100">
              {dentalHistory.map((rec) => {
                const imageUrl = getImageUrl(rec.imagePath);

                return (
                  <div key={rec.id} className="py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="font-medium text-sm">{new Date(rec.createdAt).toLocaleString()}</div>
                        <div className="text-xs text-slate-500">Confidence: {rec.confidenceScore}</div>
                      </div>
                      <button
                        onClick={() => setExpandedRecordId(expandedRecordId === rec.id ? null : rec.id)}
                        className="px-3 py-1 text-sm rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100"
                      >
                        {expandedRecordId === rec.id ? 'Hide' : 'View'}
                      </button>
                    </div>

                    {expandedRecordId === rec.id && (
                      <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-600">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt="Dental record"
                            className="w-full max-h-80 object-contain rounded-lg border border-slate-200 bg-white"
                          />
                        ) : (
                          <div className="rounded-lg border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
                            No image available
                          </div>
                        )}

                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                            <div className="text-[11px] uppercase tracking-wide text-slate-400">Quality</div>
                            <div className="mt-1 text-sm text-slate-700">{formatValue(rec.qualityScore)}</div>
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                            <div className="text-[11px] uppercase tracking-wide text-slate-400">Exposure</div>
                            <div className="mt-1 text-sm text-slate-700">{formatValue(rec.exposure)}</div>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="font-semibold text-slate-700">Detected diseases</div>
                          {rec.diseases?.length > 0 ? (
                            <ul className="list-disc pl-5 mt-2 text-sm text-slate-600 space-y-1">
                              {rec.diseases.map((d) => (
                                <li key={d.id}>{d.disease_type} — {d.severity_level} ({d.confidence})</li>
                              ))}
                            </ul>
                          ) : (
                            <div className="mt-2 text-sm text-slate-500">No diseases detected</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
