import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { db, storage } from "../firebase/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { showToast } from "../utils/toast";

function Profile() {
  const auth = getAuth();
  const user = auth.currentUser;

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    gender: "",
    birthDate: "",
    address: "",
  });

  const [profileImage, setProfileImage] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔹 Fetch Profile
  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        setForm({
          fullName: data.fullName || "",
          email: data.email || user.email,
          phone: data.phone || "",
          gender: data.gender || "",
          birthDate: data.birthDate || "",
          address: data.address || "",
        });

        setProfileImageUrl(data.profileImageUrl || "");
      } else {
        setForm((prev) => ({
          ...prev,
          email: user.email,
        }));
      }
    };

    fetchProfile();
  }, [user]);

  // 🔹 Preview profile image locally when selected
  useEffect(() => {
    if (!profileImage) {
      setPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(profileImage);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [profileImage]);

  // 🔹 Handle Input
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // 🔹 Save Profile
  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!form.fullName || isSubmitting) return;

    try {
      setIsSubmitting(true);
      let imageUrl = profileImageUrl;

      if (profileImage) {
        const imageRef = ref(
          storage,
          `profiles/${user.uid}`
        );

        await uploadBytes(imageRef, profileImage);
        imageUrl = await getDownloadURL(imageRef);
      }

      await setDoc(doc(db, "users", user.uid), {
        ...form,
        profileImageUrl: imageUrl,
      });

      setProfileImageUrl(imageUrl);
      setProfileImage(null); // Clear local preview state since it has uploaded
      showToast("Profile updated successfully!", "success");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="profile-page">
      <style>
        {`
          .profile-page {
            padding: var(--space-xl) var(--space-lg);
            background: var(--bg-default);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .profile-card {
            width: 100%;
            max-width: 600px;
            background: var(--bg-card);
            padding: var(--space-2xl);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-md);
            border: 1px solid var(--border);
            display: flex;
            flex-direction: column;
            gap: var(--space-xl);
          }
          .profile-header-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            padding-bottom: var(--space-xl);
            border-bottom: 1px solid var(--border);
          }
          .avatar-uploader {
            position: relative;
            width: 120px;
            height: 120px;
            border-radius: 50%;
            overflow: hidden;
            border: 4px solid var(--primary-light);
            cursor: pointer;
            box-shadow: var(--shadow-sm);
            transition: all var(--transition-normal);
            margin-bottom: var(--space-md);
          }
          .avatar-uploader:hover {
            border-color: var(--primary);
            transform: scale(1.02);
            box-shadow: var(--shadow-md);
          }
          .avatar-uploader img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .avatar-overlay {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 35%;
            background: rgba(0, 0, 0, 0.6);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8rem;
            font-weight: 600;
            transition: opacity var(--transition-fast);
          }
          .avatar-uploader:hover .avatar-overlay {
            background: rgba(0, 0, 0, 0.7);
          }
          .profile-title {
            color: var(--text-dark);
            font-family: var(--font-title);
            font-size: 1.5rem;
            font-weight: 700;
            margin: 0 0 var(--space-xs);
          }
          .profile-subtitle {
            color: var(--text-muted);
            font-size: 0.95rem;
            margin: 0;
          }
          .form-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: var(--space-lg);
          }
          @media (min-width: 600px) {
            .form-grid.two-cols {
              grid-template-columns: 1fr 1fr;
            }
          }
          .form-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .form-group label {
            font-weight: 600;
            font-size: 0.9rem;
            color: var(--text-dark);
          }
          .form-control {
            width: 100%;
            padding: 12px 14px;
            border-radius: var(--radius-md);
            border: 1.5px solid var(--border);
            background: #fff;
            color: var(--text);
            font-size: 1rem;
            transition: all var(--transition-fast);
          }
          .form-control:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px var(--primary-light);
          }
          .form-control:disabled {
            background: #f3f4f6;
            cursor: not-allowed;
          }
          textarea.form-control {
            resize: vertical;
            min-height: 80px;
          }
          .save-btn {
            width: 100%;
            padding: 14px;
            font-size: 1.1rem;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin-top: var(--space-md);
          }
        `}
      </style>

      <form className="profile-card" onSubmit={handleSave}>
        {/* PROFILE HEADER */}
        <div className="profile-header-section">
          <label htmlFor="profile-upload" className="avatar-uploader" tabIndex="0" onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') document.getElementById('profile-upload').click(); }}>
            <img
              src={
                previewUrl ||
                profileImageUrl ||
                "https://via.placeholder.com/150?text=Profile"
              }
              alt="Profile avatar"
            />
            <div className="avatar-overlay">
              <span>📷 Edit</span>
            </div>
          </label>
          <input
            id="profile-upload"
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setProfileImage(e.target.files[0]);
              }
            }}
            style={{ display: "none" }}
            disabled={isSubmitting}
          />

          <h2 className="profile-title">
            {form.fullName || "User Profile"}
          </h2>
          <p className="profile-subtitle">
            {form.email}
          </p>
        </div>

        {/* PERSONAL INFO */}
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              name="fullName"
              className="form-control"
              value={form.fullName}
              onChange={handleChange}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              className="form-control"
              value={form.email}
              disabled
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              name="phone"
              className="form-control"
              placeholder="+60123456789"
              value={form.phone}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-grid two-cols">
            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                name="gender"
                className="form-control"
                value={form.gender}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="birthDate">Date of Birth</label>
              <input
                id="birthDate"
                type="date"
                name="birthDate"
                className="form-control"
                value={form.birthDate}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address">Address</label>
            <textarea
              id="address"
              name="address"
              className="form-control"
              value={form.address}
              onChange={handleChange}
              rows="3"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary save-btn"
          disabled={!form.fullName || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="spinner" style={{ width: '22px', height: '22px', borderWidth: '3px' }} />
              Saving...
            </>
          ) : (
            "Save Profile"
          )}
        </button>
      </form>
    </div>
  );
}

export default Profile;