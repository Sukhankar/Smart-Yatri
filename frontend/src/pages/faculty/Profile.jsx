import { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "../../components/Sidebar";
import QRDisplay from "../../components/QRDisplay";
import { profileService } from "../../services/profileService";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "";

const initialForm = {
  fullName: "",
  schoolName: "",
  roleType: "STUDENT",
  idNumber: "",
  classOrPosition: "",
  phone: "",
  address: "",
  guardianName: "",
  guardianPhone: "",
  bio: "",
  photo: null,
};

function InputField({ label, name, value, onChange, readOnly, required }) {
  return (
    <label className="text-sm font-semibold text-slate-600 flex flex-col gap-2">
      <span>
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </span>
      <input
        name={name}
        value={value || ""}
        onChange={onChange}
        readOnly={readOnly}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:bg-slate-50"
      />
    </label>
  );
}

function TextAreaField({ label, name, value, onChange, rows = 3 }) {
  return (
    <label className="text-sm font-semibold text-slate-600 flex flex-col gap-2">
      <span>{label}</span>
      <textarea
        name={name}
        rows={rows}
        value={value || ""}
        onChange={onChange}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-200 min-h-[120px]"
      />
    </label>
  );
}

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [data, setData] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line
  }, []);

  async function loadProfile() {
    setLoading(true);
    setError("");
    try {
      const res = await profileService.getProfile();
      setData(res);
      setForm(prev => ({
        ...prev,
        ...res.profile,
      }));
    } catch (err) {
      setError(err.message || "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  const completeness = useMemo(() => {
    const fields = [
      "fullName",
      "schoolName",
      "idNumber",
      "classOrPosition",
      "phone",
      "address",
      "guardianName",
      "guardianPhone",
      "bio",
      "photo",
    ];
    const filled = fields.filter(key => form[key] && form[key].length !== 0);
    return Math.round((filled.length / fields.length) * 100);
  }, [form]);

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const payload = {
        fullName: form.fullName,
        schoolName: form.schoolName,
        roleType: form.roleType,
        idNumber: form.idNumber,
        classOrPosition: form.classOrPosition,
        phone: form.phone,
        address: form.address,
        guardianName: form.guardianName,
        guardianPhone: form.guardianPhone,
        bio: form.bio,
        photo: form.photo,
      };
      await profileService.updateProfile(payload);
      await loadProfile();
      showToast("Profile updated successfully.");
    } catch (err) {
      setError(err.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  }

  function resetForm() {
    if (!data?.profile) return;
    setForm({
      ...initialForm,
      ...data.profile,
    });
  }

  function resolvePhotoSrc(photoPath) {
    if (!photoPath) return "";
    if (photoPath.startsWith("http")) return photoPath;
    return `${SERVER_URL}${photoPath}`;
  }

  async function handlePhotoSelect(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      // The original API expects a form POST to /api/profile/upload-photo.
      // So keep the custom logic, just like the original.
      const formDataObj = new FormData();
      formDataObj.append("photo", file);
      const res = await fetch(`${SERVER_URL}/api/profile/upload-photo`, {
        method: "POST",
        credentials: "include",
        body: formDataObj,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Photo upload failed.");
      setForm(prev => ({ ...prev, photo: data.photoUrl }));
      setData(prev =>
        prev
          ? { ...prev, profile: { ...prev.profile, photo: data.photoUrl } }
          : prev
      );
      showToast("Profile photo updated.");
    } catch (err) {
      setError(err.message || "Failed to upload photo.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handlePhotoDelete() {
    setUploading(true);
    setError("");
    try {
      // Simulate API: clear photo in profile.
      await profileService.updateProfile({ ...form, photo: null });
      setForm(prev => ({ ...prev, photo: null }));
      setData(prev =>
        prev ? { ...prev, profile: { ...prev.profile, photo: null } } : prev
      );
      showToast("Profile photo removed.");
      await loadProfile();
    } catch (err) {
      setError(err.message || "Failed to delete photo.");
    } finally {
      setUploading(false);
    }
  }

  const stats = data?.stats ?? {
    activePasses: 0,
    totalPasses: 0,
    tickets: 0,
    travelEntries: 0,
  };
  const activity = data?.activity ?? [];
  const email = data?.profile?.email || "";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex">
        <Sidebar role="faculty" />
        <div className="flex-1 p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-48 bg-white rounded-3xl shadow" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="h-80 bg-white rounded-3xl shadow" />
              <div className="lg:col-span-2 h-80 bg-white rounded-3xl shadow" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar role="faculty" />
      <div className="flex-1 p-4 md:p-8 space-y-6">
        {/* Upper Card with quick stats */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl text-white p-8 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <p className="uppercase tracking-wide text-xs text-white/70">
                Faculty Profile
              </p>
              <h1 className="text-3xl md:text-4xl font-black mt-2">
                {form.fullName || "Faculty"}
              </h1>
              <div className="flex flex-wrap gap-3 mt-4 text-sm font-semibold">
                {form.idNumber && (
                  <span className="bg-white/20 px-3 py-1 rounded-full border border-white/30">
                    ID: {form.idNumber}
                  </span>
                )}
                {form.classOrPosition && (
                  <span className="bg-white/20 px-3 py-1 rounded-full border border-white/30">
                    {form.classOrPosition}
                  </span>
                )}
                {data?.profile?.roleType && (
                  <span className="bg-white/20 px-3 py-1 rounded-full border border-white/30">
                    {data.profile.roleType}
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-6">
              {[
                { label: "Active Passes", value: stats.activePasses },
                { label: "Total Passes", value: stats.totalPasses },
                { label: "Tickets", value: stats.tickets },
                { label: "Trips Logged", value: stats.travelEntries },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-white/15 rounded-2xl px-4 py-3 text-center backdrop-blur"
                >
                  <p className="text-2xl font-black">{item.value}</p>
                  <p className="text-xs uppercase tracking-wide text-white/70">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-2xl">{error}</div>
        )}
        {toast && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-2xl">{toast}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Photo and Side Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow p-6">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="relative">
                  <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-white shadow-lg bg-slate-100 flex items-center justify-center text-5xl text-slate-400">
                    {form.photo ? (
                      <img
                        src={resolvePhotoSrc(form.photo)}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      form.fullName?.[0]?.toUpperCase() || "?"
                    )}
                  </div>
                  {uploading && (
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      Uploading...
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-700">
                    {form.fullName || "Faculty"}
                  </p>
                  <p className="text-sm text-slate-500">{email}</p>
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <label className="w-full">
                    <span className="sr-only">Upload photo</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                      onChange={handlePhotoSelect}
                      disabled={uploading}
                    />
                    <span
                      className="inline-flex w-full justify-center items-center gap-2 bg-slate-900 text-white text-sm font-semibold px-4 py-2 rounded-2xl cursor-pointer hover:bg-slate-700 transition"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Upload Photo
                    </span>
                  </label>
                  {form.photo && (
                    <button
                      type="button"
                      onClick={handlePhotoDelete}
                      disabled={uploading}
                      className="inline-flex w-full justify-center items-center gap-2 border border-slate-200 text-slate-600 text-sm font-semibold px-4 py-2 rounded-2xl hover:bg-slate-50 transition"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Health */}
            <div className="bg-white rounded-3xl shadow p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-700">Profile health</p>
                <span className="text-sm font-bold text-slate-500">
                  {completeness}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all"
                  style={{ width: `${completeness}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">
                Complete your profile to help conductors verify you faster.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                {!form.phone && <li>• Add a contact number</li>}
                {!form.address && <li>• Provide your address</li>}
                {!form.guardianPhone && <li>• Add guardian contact</li>}
              </ul>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-3xl shadow p-6">
              <p className="font-semibold text-slate-700 mb-4">Recent activity</p>
              <div className="space-y-4 max-h-80 overflow-auto pr-2">
                {activity.length === 0 && (
                  <p className="text-sm text-slate-500">No activity yet.</p>
                )}
                {activity.map((item, idx) => (
                  <div key={`${item.type}-${idx}`} className="flex gap-3">
                    <div className="w-2 h-2 mt-3 rounded-full bg-sky-500" />
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{item.title}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(item.timestamp).toLocaleString()} · {item.meta}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Profile Details Main Panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl shadow p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-bold text-slate-800">Personal details</p>
                  <p className="text-sm text-slate-500">
                    Keep your personal and academic info up to date.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-sm font-semibold text-slate-500 hover:text-slate-700"
                >
                  Reset
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputField
                  label="Full Name"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                />
                <InputField
                  label="Email"
                  name="email"
                  value={email}
                  readOnly
                />
                <InputField
                  label="School / College"
                  name="schoolName"
                  value={form.schoolName}
                  onChange={handleChange}
                />
                <InputField
                  label="Student ID"
                  name="idNumber"
                  value={form.idNumber}
                  onChange={handleChange}
                />
                <InputField
                  label="Class / Semester"
                  name="classOrPosition"
                  value={form.classOrPosition}
                  onChange={handleChange}
                />
                <InputField
                  label="Primary Contact Number"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                />
                <InputField
                  label="Guardian Name"
                  name="guardianName"
                  value={form.guardianName}
                  onChange={handleChange}
                />
                <InputField
                  label="Guardian Contact"
                  name="guardianPhone"
                  value={form.guardianPhone}
                  onChange={handleChange}
                />
              </div>
              <div className="grid grid-cols-1 gap-5">
                <TextAreaField
                  label="Residential Address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                />
                <TextAreaField
                  label="About / Notes for admin"
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  rows={4}
                />
              </div>
              <div className="flex flex-wrap gap-4 justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 rounded-2xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl transition disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>

            {/* QR code Section */}
            {data?.profile?.qrId && (
              <div className="bg-white rounded-3xl shadow p-6 space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">My QR Code</h2>
                </div>
                <QRDisplay
                  qrId={data.profile.qrId}
                  qrCode={null}
                  status="ACTIVE"
                  profile={data.profile}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
