import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Get backend base url from env variable
const SERVER_URL = import.meta.env.VITE_SERVER_URL || "";

// Helpers and shared
async function signupUser({
  username,
  password,
  email,
  roleId,
  loginType,
  profile,
}) {
  const res = await fetch(`${SERVER_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      password,
      email,
      roleId,
      loginType,
      profile,
    }),
  });

  // Handle possible fetch/network errors
  if (!res.ok) {
    let errMsg = `Signup failed with status ${res.status}`;
    try {
      const errData = await res.json();
      return { success: false, error: errData?.error || errMsg };
    } catch {
      return { success: false, error: errMsg };
    }
  }
  // Defensive: catch non-JSON responses
  try {
    return await res.json();
  } catch {
    return { success: false, error: "Invalid response from server." };
  }
}

function getLabelClass(value, isFocused) {
  return [
    "absolute left-0 text-gray-500 text-base font-semibold transition-all duration-300 pointer-events-none",
    (isFocused || (value && value.length > 0))
      ? "-top-5 text-xs text-blue-600 font-bold"
      : "top-3 text-base"
  ].join(" ");
}

function RoleDropdown({
  value,
  onChange,
  options,
  inputRef,
  onMoveNext,
  loading,
  error
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef(null);

  // Fix: Option highlighting must never go out of bounds
  useEffect(() => {
    if (open && containerRef.current && options.length > 0) {
      const optionBtn = containerRef.current.querySelector(
        `button[data-index="${highlight}"]`
      );
      if (optionBtn) optionBtn.scrollIntoView({ block: "nearest" });
    }
  }, [open, highlight, options.length]);

  // If options change and selected value no longer exists, reset highlight
  useEffect(() => {
    if (!open) {
      setHighlight(0);
    } else {
      let idx = options.findIndex((r) => "" + r.id === "" + value);
      setHighlight(idx >= 0 ? idx : 0);
    }
  }, [open, value, options]);

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === "Enter" || e.key === " ") {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }
    if (open && options.length > 0) {
      if (e.key === "ArrowDown") {
        setHighlight((h) => {
          // Fix: Prevent modulo with 0 or empty options
          if (options.length === 0) return 0;
          return (h + 1) % options.length;
        });
        e.preventDefault();
      } else if (e.key === "ArrowUp") {
        setHighlight((h) => {
          if (options.length === 0) return 0;
          return (h - 1 + options.length) % options.length;
        });
        e.preventDefault();
      } else if (e.key === "Escape") {
        setOpen(false);
        e.preventDefault();
      } else if (e.key === "Tab") {
        setOpen(false);
      } else if (e.key === "Enter") {
        const selected = options[highlight];
        if (selected) {
          onChange({
            target: {
              name: "roleId",
              value: selected.id,
              roleName: selected.name,
              roleType: selected.type
            }
          });
          setOpen(false);
          if (onMoveNext) {
            setTimeout(() => onMoveNext(), 0);
          }
        }
        e.preventDefault();
      }
    }
  };

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Bugfix: Avoid crashing if options are empty and .find returns undefined
  const getSelectedRoleName = () => {
    if (!value || !Array.isArray(options)) return "Select Role";
    const found = options.find((r) => "" + r.id === "" + value);
    return found ? found.name : "Select Role";
  };

  return (
    <div className="relative group" ref={containerRef}>
      <button
        ref={inputRef}
        type="button"
        name="roleId"
        onClick={() => setOpen((x) => !x)}
        onFocus={() => {/* Do not open on focus (avoiding flicker) */}}
        onBlur={() => { setTimeout(() => setOpen(false), 120); }}
        onKeyDown={handleKeyDown}
        className={`w-full text-left border-0 border-b-2 border-blue-300 focus:border-blue-600 bg-transparent px-0 py-3 text-lg font-medium text-gray-800 transition-all duration-300 cursor-pointer min-h-[27px] outline-none ${!value ? "text-gray-400" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby="roleIdLabel"
        tabIndex={0}
        disabled={loading}
        required
      >
        {getSelectedRoleName()}
      </button>
      <label
        id="roleIdLabel"
        htmlFor="roleId"
        className={[
          "absolute left-0 text-gray-500 text-xs text-blue-600 font-bold -top-5 transition-all duration-300 pointer-events-none"
        ].join(" ")}
      >
        Role <span className="text-red-500">*</span>
      </label>
      {open && (
        <ul
          className="absolute z-20 left-0 right-0 shadow-lg bg-white rounded max-h-56 overflow-auto border border-blue-200 mt-2"
          role="listbox"
        >
          {options.length === 0 && (
            <li className="py-2 px-4 text-gray-400 select-none">
              No roles available
            </li>
          )}
          {options.map((r, i) => (
            <li key={r.id}>
              <button
                data-index={i}
                tabIndex={-1}
                type="button"
                className={`w-full text-left px-4 py-2 text-base hover:bg-blue-50 ${i === highlight ? "bg-blue-100 text-blue-800 font-bold" : ""}`}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => {
                  onChange({
                    target: {
                      name: "roleId",
                      value: r.id,
                      roleName: r.name,
                      roleType: r.type
                    }
                  });
                  setOpen(false);
                  if (onMoveNext) setTimeout(onMoveNext, 0);
                }}
              >
                {r.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function getRoleTypeFromRoles(roles, roleId) {
  if (!roleId) return "";
  const found = Array.isArray(roles) ? roles.find(r => "" + r.id === "" + roleId) : null;
  if (!found) return "";
  return found.type ? found.type.toUpperCase() : "STUDENT";
}

// PART ONE: Account login data
function SignupFormPart1({
  form,
  focus,
  loading,
  error,
  onChange,
  onNext,
  onFocus,
  onBlur,
  onInputKeyDown,
  roles,
  roleRef,
  usernameRef,
  emailRef,
  passwordRef
}) {
  return (
    <div className="space-y-7">
      <div className="relative group">
        <input
          ref={usernameRef}
          id="username"
          name="username"
          value={form.username}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={e => onInputKeyDown(e, "username")}
          className="peer w-full border-0 border-b-2 border-blue-300 focus:border-blue-600 bg-transparent px-0 py-3 text-lg font-medium text-gray-800 placeholder-transparent focus:outline-none transition-all duration-300"
          required
          autoComplete="username"
          disabled={loading}
          placeholder=" "
        />
        <label
          htmlFor="username"
          className={getLabelClass(form.username, focus.username)}
        >
          Username <span className="text-red-500">*</span>
        </label>
      </div>
      <div className="relative group">
        <input
          ref={emailRef}
          id="email"
          name="email"
          type="email"
          value={form.email}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={e => onInputKeyDown(e, "email")}
          className="peer w-full border-0 border-b-2 border-blue-300 focus:border-blue-600 bg-transparent px-0 py-3 text-lg font-medium text-gray-800 placeholder-transparent focus:outline-none transition-all duration-300"
          autoComplete="email"
          disabled={loading}
          placeholder=" "
        />
        <label
          htmlFor="email"
          className={getLabelClass(form.email, focus.email)}
        >
          Email
        </label>
      </div>
      <div className="relative group">
        <input
          ref={passwordRef}
          id="password"
          name="password"
          type="password"
          value={form.password}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={e => onInputKeyDown(e, "password")}
          className="peer w-full border-0 border-b-2 border-blue-300 focus:border-blue-600 bg-transparent px-0 py-3 text-lg font-medium text-gray-800 placeholder-transparent focus:outline-none transition-all duration-300"
          required
          autoComplete="new-password"
          disabled={loading}
          placeholder=" "
        />
        <label
          htmlFor="password"
          className={getLabelClass(form.password, focus.password)}
        >
          Password <span className="text-red-500">*</span>
        </label>
      </div>
      <RoleDropdown
        value={form.roleId}
        onChange={onChange}
        options={roles}
        inputRef={roleRef}
        onMoveNext={() => onNext && onNext()}
        loading={loading}
        error={error}
      />
      {error && (
        <div className="animate-fade-in-down text-red-600 font-semibold bg-red-100/80 border border-red-200 rounded-lg px-4 py-2 mt-2 text-center shadow-md transition-all duration-300">
          {error}
        </div>
      )}
      <button
        type="button"
        className="w-full py-3 rounded-xl font-extrabold text-lg transition-all duration-300 bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500 text-white shadow-xl hover:from-blue-700 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 mt-4"
        onClick={onNext}
        disabled={loading}
      >
        Next
      </button>
    </div>
  );
}

// PART TWO: Profile information
function SignupFormPart2({
  form,
  focus,
  loading,
  error,
  onChange,
  onSignup,
  onFocus,
  onBlur,
  onInputKeyDown,
  fullNameRef,
  schoolNameRef,
  idNumberRef,
  classOrPositionRef,
  onBack,
  success
}) {
  return (
    <div className="space-y-7">
      <div className="relative group">
        <input
          ref={fullNameRef}
          id="fullName"
          name="fullName"
          value={form.fullName}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={e => onInputKeyDown(e, "fullName")}
          className="peer w-full border-0 border-b-2 border-blue-300 focus:border-blue-600 bg-transparent px-0 py-3 text-lg font-medium text-gray-800 placeholder-transparent focus:outline-none transition-all duration-300"
          required
          disabled={loading}
          placeholder=" "
        />
        <label
          htmlFor="fullName"
          className={getLabelClass(form.fullName, focus.fullName)}
        >
          Full Name <span className="text-red-500">*</span>
        </label>
      </div>
      <div className="relative group">
        <input
          ref={schoolNameRef}
          id="schoolName"
          name="schoolName"
          value={form.schoolName}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={e => onInputKeyDown(e, "schoolName")}
          className="peer w-full border-0 border-b-2 border-blue-300 focus:border-blue-600 bg-transparent px-0 py-3 text-lg font-medium text-gray-800 placeholder-transparent focus:outline-none transition-all duration-300"
          disabled={loading}
          placeholder=" "
        />
        <label
          htmlFor="schoolName"
          className={getLabelClass(form.schoolName, focus.schoolName)}
        >
          School Name
        </label>
      </div>
      <div className="relative group">
        <input
          ref={idNumberRef}
          id="idNumber"
          name="idNumber"
          value={form.idNumber}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={e => onInputKeyDown(e, "idNumber")}
          className="peer w-full border-0 border-b-2 border-blue-300 focus:border-blue-600 bg-transparent px-0 py-3 text-lg font-medium text-gray-800 placeholder-transparent focus:outline-none transition-all duration-300"
          disabled={loading}
          placeholder=" "
        />
        <label
          htmlFor="idNumber"
          className={getLabelClass(form.idNumber, focus.idNumber)}
        >
          ID Number (Student/Staff)
        </label>
      </div>
      <div className="relative group">
        <input
          ref={classOrPositionRef}
          id="classOrPosition"
          name="classOrPosition"
          value={form.classOrPosition}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={e => onInputKeyDown(e, "classOrPosition")}
          className="peer w-full border-0 border-b-2 border-blue-300 focus:border-blue-600 bg-transparent px-0 py-3 text-lg font-medium text-gray-800 placeholder-transparent focus:outline-none transition-all duration-300"
          disabled={loading}
          placeholder=" "
        />
        <label
          htmlFor="classOrPosition"
          className={getLabelClass(form.classOrPosition, focus.classOrPosition)}
        >
          Class/Grade or Position
        </label>
      </div>
      <div className="flex gap-3 mt-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 rounded-xl font-bold text-lg bg-gradient-to-r from-gray-100 to-gray-300 text-blue-700 shadow hover:from-gray-200 hover:to-gray-400 border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
          disabled={loading}
        >
          Back
        </button>
        <button
          type="submit"
          className={`flex-1 py-3 rounded-xl font-extrabold text-lg transition-all duration-300 bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500 text-white shadow-xl hover:from-blue-700 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
          disabled={loading}
          onClick={onSignup}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                ></path>
              </svg>
              Signing up...
            </span>
          ) : "Sign Up"}
        </button>
      </div>
      {/* Only show error/success below all fields */}
      {error && (
        <div className="animate-fade-in-down text-red-600 font-semibold bg-red-100/80 border border-red-200 rounded-lg px-4 py-2 mt-2 text-center shadow-md transition-all duration-300">
          {error}
        </div>
      )}
      {success && (
        <div className="animate-fade-in-up text-green-700 font-semibold bg-green-100/80 border-green-200 rounded-lg px-4 py-2 mt-2 text-center shadow-md transition-all duration-300">
          {success}
        </div>
      )}
    </div>
  );
}

export default function SignupPage() {
  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    roleId: "",
    roleType: "",
    fullName: "",
    schoolName: "",
    idNumber: "",
    classOrPosition: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [step, setStep] = useState(1);

  const navigate = useNavigate();

  // Floating/focus for labels
  const [focus, setFocus] = useState({
    username: false,
    password: false,
    email: false,
    roleId: false,
    fullName: false,
    schoolName: false,
    idNumber: false,
    classOrPosition: false,
  });

  // Refs for focus
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const emailRef = useRef(null);
  const roleRef = useRef(null);
  const fullNameRef = useRef(null);
  const schoolNameRef = useRef(null);
  const idNumberRef = useRef(null);
  const classOrPositionRef = useRef(null);

  function focusNextField(current) {
    if (current === "username" && emailRef.current) {
      emailRef.current.focus();
    } else if (current === "email" && passwordRef.current) {
      passwordRef.current.focus();
    } else if (current === "password" && roleRef.current) {
      roleRef.current.focus();
    } else if (current === "roleId" && fullNameRef.current) {
      fullNameRef.current.focus();
    } else if (current === "fullName" && schoolNameRef.current) {
      schoolNameRef.current.focus();
    } else if (current === "schoolName" && idNumberRef.current) {
      idNumberRef.current.focus();
    } else if (current === "idNumber" && classOrPositionRef.current) {
      classOrPositionRef.current.focus();
    }
  }

  // Roles from backend
  const [roles, setRoles] = useState([]);
  useEffect(() => {
    let isMounted = true;
    async function fetchRoles() {
      try {
        const res = await fetch(`${SERVER_URL}/api/permissions/roles`);
        if (!res.ok) throw new Error("Could not fetch roles");
        const data = await res.json();
        let rolesRaw = Array.isArray(data?.roles)
          ? data.roles
          : Array.isArray(data)
          ? data
          : [];
        if (isMounted) setRoles(Array.isArray(rolesRaw) ? rolesRaw : []);
      } catch {
        if (isMounted) setRoles([]);
      }
    }
    fetchRoles();
    // Cleanup (prevents setting state when component is unmounted)
    return () => {
      isMounted = false;
    };
  }, []);

  const handleFocus = (e) => {
    setFocus((prev) => ({ ...prev, [e.target.name]: true }));
  };
  const handleBlur = (e) => {
    setFocus((prev) => ({ ...prev, [e.target.name]: false }));
  };

  const handleChange = (e) => {
    setForm(prev => {
      // Some browsers may send events without .target defined
      if (!e || !e.target || !e.target.name) return prev;
      if (e.target.name === "roleId" && e.target.roleType) {
        return {
          ...prev,
          roleId: e.target.value,
          roleType: e.target.roleType,
        }
      }
      return {
        ...prev,
        [e.target.name]: e.target.value
      };
    });
  };

  function handleInputKeyDown(e, fieldName) {
    if (e.key === "Enter") {
      e.preventDefault();
      focusNextField(fieldName);
    }
  }

  const handleNext = () => {
    // validation for part 1
    if (!form.username || !form.password || !form.roleId) {
      setError("Please fill all required fields. Role is mandatory.");
      return;
    }
    setError("");
    setStep(2);
    setTimeout(() => {
      if (fullNameRef.current) fullNameRef.current.focus();
    }, 100);
  };

  const handleBack = () => {
    setStep(1);
    setError("");
    setTimeout(() => {
      if (usernameRef.current) usernameRef.current.focus();
    }, 100);
  };

  const handleSignup = async (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!form.fullName) {
      setError("Please enter your full name.");
      setLoading(false);
      return;
    }
    // Infer roleType for profile (STUDENT/STAFF/...)
    const finalRoleType =
      form.roleType ||
      getRoleTypeFromRoles(roles, form.roleId) ||
      "STUDENT";

    try {
      const result = await signupUser({
        username: form.username,
        password: form.password,
        email: form.email,
        roleId: form.roleId
          ? (typeof form.roleId === "string" && /^\d+$/.test(form.roleId)
              ? Number(form.roleId)
              : form.roleId)
          : null,
        loginType: finalRoleType, // UserLogin.loginType
        profile: {
          fullName: form.fullName,
          schoolName: form.schoolName,
          roleType: finalRoleType, // UserProfile.roleType
          idNumber: form.idNumber,
          classOrPosition: form.classOrPosition,
        },
      });
      if (result?.success) {
        setSuccess("Signup successful! You can now log in.");
        setForm({
          username: "",
          password: "",
          email: "",
          roleId: "",
          roleType: "",
          fullName: "",
          schoolName: "",
          idNumber: "",
          classOrPosition: "",
        });
        setTimeout(() => navigate("/Login"), 1500);
      } else {
        setError(result?.error || "Signup failed.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 via-blue-100 to-cyan-100">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-blue-200 p-10">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-500 mb-10 text-center tracking-tight drop-shadow-lg">
          Sign Up
        </h1>
        <form onSubmit={e => { e.preventDefault(); }}>
          {step === 1 && (
            <SignupFormPart1
              form={form}
              focus={focus}
              loading={loading}
              error={error}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onNext={handleNext}
              onInputKeyDown={handleInputKeyDown}
              roles={roles}
              usernameRef={usernameRef}
              emailRef={emailRef}
              passwordRef={passwordRef}
              roleRef={roleRef}
            />
          )}
          {step === 2 && (
            <SignupFormPart2
              form={form}
              focus={focus}
              loading={loading}
              error={error}
              success={success}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onInputKeyDown={handleInputKeyDown}
              onSignup={handleSignup}
              fullNameRef={fullNameRef}
              schoolNameRef={schoolNameRef}
              idNumberRef={idNumberRef}
              classOrPositionRef={classOrPositionRef}
              onBack={handleBack}
            />
          )}
        </form>
        <div className="mt-6 text-center">
          <span>
            Already have an account?{" "}
            <a
              className="text-blue-600 font-bold hover:underline"
              href="/Login"
            >
              Login
            </a>
          </span>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(32px);}
          100% { opacity: 1; transform: translateY(0);}
        }
        @keyframes fade-in-down {
          0% { opacity: 0; transform: translateY(-16px);}
          100% { opacity: 1; transform: translateY(0);}
        }
        .animate-fade-in-up { animation: fade-in-up 0.7s cubic-bezier(.4,0,.2,1) both; }
        .animate-fade-in-down { animation: fade-in-down 0.5s cubic-bezier(.4,0,.2,1) both; }
      `}</style>
    </div>
  );
}
