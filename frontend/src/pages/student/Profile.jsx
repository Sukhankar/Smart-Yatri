import { useState } from 'react';
import Sidebar from '../../components/Sidebar';

const initialProfileData = {
  avatar: 'https://randomuser.me/api/portraits/men/32.jpg', // Change to student's real avatar if available
  fullName: 'Alex Johnson',
  email: 'alex.johnson@student.university.edu',
  major: 'Computer Science',
  role: 'Student',
  studentId: 'S1234567',
  joined: 'September 2022',
};

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(initialProfileData);
  const [form, setForm] = useState({
    fullName: profileData.fullName,
    email: profileData.email,
    major: profileData.major,
    avatar: profileData.avatar,
  });

  const handleEditClick = () => setIsEditing(true);

  const handleCancelClick = () => {
    setForm({
      fullName: profileData.fullName,
      email: profileData.email,
      major: profileData.major,
      avatar: profileData.avatar,
    });
    setIsEditing(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: value,
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setProfileData((prev) => ({
      ...prev,
      ...form,
    }));
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f6fa] to-[#dde1e7] flex font-[San Francisco,system-ui,sans-serif] transition-all">
      <Sidebar role="student" />
      <div className="flex-1 flex justify-center py-12 px-4">
        <div className="w-full max-w-5xl flex gap-10">
          {/* Apple-style Card Left: Bio */}
          <aside
            className="w-full max-w-sm bg-white/70 rounded-3xl shadow-xl border border-[#e3e4e8] px-10 py-12 flex flex-col items-center backdrop-blur-[8px] transition-all duration-300"
            style={{
              boxShadow:
                '0 12px 64px 0 rgba(29,35,54,0.08), 0 1.5px 5px rgba(0,0,0,0.02)',
              border: '1.2px solid #edf0f1',
            }}
          >
            <div className="relative mb-6">
              <img
                src={profileData.avatar}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-[6px] border-white/80 shadow-lg transition-transform duration-300 hover:scale-[1.04]"
                style={{
                  boxShadow: '0 6px 32px 0 rgba(29,35,54,0.11), 0 1.5px 8px rgba(0,0,0,0.02)',
                  background: 'linear-gradient(145deg,#f6f8fa 0,#e7edf3 100%)',
                }}
              />
            </div>
            <h2 className="text-[1.9rem] font-bold text-gray-900 mb-1 tracking-tight text-center">
              {profileData.fullName}
            </h2>
            <span className="text-gray-600 text-[1.15rem] mb-5 font-medium tracking-wide px-3 py-0.5 rounded-full bg-gray-200/70">
              {profileData.role}
            </span>
            <div className="mt-1 w-full space-y-5">
              <div className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 rounded bg-gray-900/90"></span>
                <div>
                  <div className="text-xs text-gray-500 font-semibold">Student ID</div>
                  <div className="text-gray-900 font-medium leading-tight">{profileData.studentId}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 rounded bg-[#2d72ea]/80"></span>
                <div>
                  <div className="text-xs text-gray-500 font-semibold">Email</div>
                  <div className="text-gray-700 font-medium leading-tight">{profileData.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 rounded bg-[#fdcf60]/80"></span>
                <div>
                  <div className="text-xs text-gray-500 font-semibold">Major</div>
                  <div className="text-gray-700 font-medium leading-tight">{profileData.major}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 rounded bg-[#38c16c]/80"></span>
                <div>
                  <div className="text-xs text-gray-500 font-semibold">Joined</div>
                  <div className="text-gray-700">{profileData.joined}</div>
                </div>
              </div>
            </div>
            <div className="mt-10 w-full flex flex-col items-stretch gap-3">
              {!isEditing && (
                <button
                  onClick={handleEditClick}
                  className="rounded-lg bg-gray-900 text-white py-2.5 px-4 font-semibold hover:bg-gray-800 active:bg-gray-950 active:scale-[.98] shadow-md transition-all text-base"
                  style={{
                    fontWeight: 600,
                    letterSpacing: '.01em',
                  }}
                >
                  Edit Profile
                </button>
              )}
              <button
                className="rounded-lg bg-white/90 border border-gray-300 text-gray-800 py-2.5 px-4 font-semibold hover:bg-gray-50 transition shadow"
                style={{
                  fontWeight: 500,
                  letterSpacing: '.01em',
                }}
              >
                Log Out
              </button>
            </div>
          </aside>

          {/* Apple-style Right Panel: Edit Form */}
          {isEditing && (
            <main className="flex-1 flex flex-col items-center justify-center">
              <form
                className="bg-white/75 rounded-3xl border border-[#e3e4e8] shadow-xl px-12 py-12 w-full max-w-2xl backdrop-blur-[8px]
                  transition-all duration-300"
                onSubmit={handleSave}
                style={{
                  boxShadow:
                    '0 8px 48px 0 rgba(29,35,54,0.07), 0 1.5px 5px rgba(0,0,0,0.024)',
                  border: '1.2px solid #edf0f1',
                }}
              >
                <h3 className="text-2xl font-semibold mb-8 text-gray-900 text-center leading-none">
                  Edit Profile
                </h3>
                <div className="flex items-center gap-3 mb-8">
                  <svg
                    height="28"
                    width="28"
                    viewBox="0 0 24 24"
                    className="text-gray-400"
                  >
                    <path
                      fill="#bbb"
                      d="M13 9h8v10H3V9h8V7H5V5h2V3H3v6h10V5h-2v2h2v2zm-4.293 4l-1.414 1.414L10.586 18 19 9.586l-1.414-1.414L10.586 15.586z"
                    />
                  </svg>
                  <span className="text-gray-400 text-base">
                    You can edit your profile details here.
                  </span>
                </div>
                <div className="flex gap-10 flex-col sm:flex-row">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/70 shadow-lg mb-2"
                      style={{
                        boxShadow:
                          '0 4px 16px 0 rgba(29,35,54,0.11), 0 1px 2px rgba(0,0,0,0.01)',
                        background: 'linear-gradient(140deg,#f9fafb 0,#e9eef2 100%)',
                      }}
                    >
                      <img
                        src={form.avatar}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* In a real app, avatar upload */}
                    <input
                      type="url"
                      name="avatar"
                      className="mt-2 w-[160px] px-2 py-2 text-base border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:border-blue-400 transition"
                      value={form.avatar}
                      onChange={handleChange}
                      placeholder="Avatar image URL"
                    />
                  </div>
                  <div className="flex-1 space-y-6">
                    <div>
                      <label className="block text-gray-600 font-semibold mb-2 text-sm tracking-wide">
                        Full Name
                      </label>
                      <input
                        name="fullName"
                        type="text"
                        value={form.fullName}
                        onChange={handleChange}
                        className="w-full border border-gray-200 rounded-md px-4 py-3 text-gray-900 shadow focus:border-blue-500 focus:outline-none text-base transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 font-semibold mb-2 text-sm tracking-wide">
                        Email
                      </label>
                      <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        className="w-full border border-gray-200 rounded-md px-4 py-3 text-gray-900 shadow focus:border-blue-500 focus:outline-none text-base transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 font-semibold mb-2 text-sm tracking-wide">
                        Major
                      </label>
                      <input
                        name="major"
                        type="text"
                        value={form.major}
                        onChange={handleChange}
                        className="w-full border border-gray-200 rounded-md px-4 py-3 text-gray-900 shadow focus:border-blue-500 focus:outline-none text-base transition"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 pt-9 justify-center">
                  <button
                    type="submit"
                    className="bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2.5 px-7 rounded-lg transition-all shadow-md border border-transparent active:scale-[.97] text-lg"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelClick}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-2.5 px-7 rounded-lg transition-all border border-gray-300 shadow text-lg"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </main>
          )}
        </div>
      </div>
    </div>
  );
}
