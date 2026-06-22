import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { db, storage } from "../firebase/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

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

  // 🔹 Handle Input
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // 🔹 Save Profile
  const handleSave = async () => {
    try {
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

      alert("Profile updated!");
    } catch (error) {
      alert(error.message);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "10px",
    marginBottom: "15px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  };

  return (
    <div
      style={{
        padding: "30px",
        background: "#f9f9f9",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          maxWidth: "550px",
          margin: "auto",
          background: "white",
          padding: "30px",
          borderRadius: "15px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            color: "#2e7d32",
            marginBottom: "20px",
          }}
        >
          My Profile
        </h1>

        {/* PROFILE HEADER */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "30px",
            paddingBottom: "20px",
            borderBottom: "1px solid #eee",
          }}
        >
          <img
            src={
              profileImageUrl ||
              "https://via.placeholder.com/150?text=Profile"
            }
            alt="Profile"
            style={{
              width: "130px",
              height: "130px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "4px solid #2e7d32",
              marginBottom: "15px",
            }}
          />

          <div style={{ marginBottom: "10px" }}>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setProfileImage(e.target.files[0])}
            />
          </div>

          <h2 style={{ marginBottom: "5px" }}>
            {form.fullName || "User"}
          </h2>

          <p
            style={{
              color: "#777",
              margin: 0,
            }}
          >
            {form.email}
          </p>
        </div>

        {/* PERSONAL INFO */}
        <h3 style={{ marginBottom: "15px" }}>
          Personal Information
        </h3>

        <label>Full Name</label>
        <input
          name="fullName"
          value={form.fullName}
          onChange={handleChange}
          style={inputStyle}
        />

        <label>Email</label>
        <input
          name="email"
          value={form.email}
          disabled
          style={{
            ...inputStyle,
            background: "#f3f3f3",
          }}
        />

        <label>Phone Number</label>
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          style={inputStyle}
        />

        <label>Gender</label>
        <select
          name="gender"
          value={form.gender}
          onChange={handleChange}
          style={inputStyle}
        >
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>

        <label>Date of Birth</label>
        <input
          type="date"
          name="birthDate"
          value={form.birthDate}
          onChange={handleChange}
          style={inputStyle}
        />

        <label>Address</label>
        <textarea
          name="address"
          value={form.address}
          onChange={handleChange}
          rows="3"
          style={{
            ...inputStyle,
            resize: "vertical",
          }}
        />

        <button
          onClick={handleSave}
          disabled={!form.fullName}
          style={{
            width: "100%",
            padding: "12px",
            background: form.fullName
              ? "#2e7d32"
              : "#aaa",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: form.fullName
              ? "pointer"
              : "not-allowed",
            fontWeight: "bold",
            marginTop: "10px",
          }}
        >
          Save Profile
        </button>
      </div>
    </div>
  );
}

export default Profile;