import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { getMyProfile, updateMyProfile } from "../../services/profileService";
import "./ProfilePage.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    address: "",
    office_location: "",
    profile_image: null,
  });

  const [previewImage, setPreviewImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "";

    if (imagePath.startsWith("http")) {
      return imagePath;
    }

    return `${API_BASE_URL}/static/${imagePath}`;
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMyProfile();

      setProfile(data);
      setForm({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        phone: data.profile?.phone || "",
        address: data.profile?.address || "",
        office_location: data.profile?.office_location || "",
        profile_image: null,
      });

      setPreviewImage(getImageUrl(data.profile?.profile_image));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (files) {
      const file = files[0];

      setForm((prev) => ({
        ...prev,
        [name]: file,
      }));

      if (file) {
        setPreviewImage(URL.createObjectURL(file));
      }

      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const buildFormData = () => {
    const formData = new FormData();

    formData.append("first_name", form.first_name);
    formData.append("last_name", form.last_name);
    formData.append("phone", form.phone || "");

    if (profile?.role === "Student") {
      formData.append("address", form.address || "");
    }

    if (profile?.role === "Lecturer" || profile?.role === "Department Staff") {
      formData.append("office_location", form.office_location || "");
    }

    if (form.profile_image) {
      formData.append("profile_image", form.profile_image);
    }

    return formData;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const data = await updateMyProfile(buildFormData());

      setProfile(data);
      setPreviewImage(getImageUrl(data.profile?.profile_image));
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const getReadableLabel = (key) => {
    const labels = {
      student_number: "Student Number",
      staff_number: "Staff Number",
      academic_email: "Academic Email",
      phone: "Phone",
      date_of_birth: "Date of Birth",
      gender: "Gender",
      address: "Address",
      programme_name: "Programme Name",
      year_of_study: "Year of Study",
      enrollment_date: "Enrollment Date",
      department: "Department",
      qualification: "Qualification",
      specialization: "Specialization",
      office_location: "Office Location",
      hire_date: "Hire Date",
      job_title: "Job Title",
    };

    return labels[key] || key.replaceAll("_", " ");
  };

  const visibleProfileEntries = () => {
    if (!profile?.profile) return [];

    return Object.entries(profile.profile).filter(
      ([key]) => key !== "profile_image"
    );
  };

  const renderEditableRoleFields = () => {
    if (!profile) return null;

    return (
      <>
        <div className="form-group">
          <label>Phone</label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Enter phone number"
          />
        </div>

        {profile.role === "Student" && (
          <div className="form-group full-width">
            <label>Address</label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Enter address"
            />
          </div>
        )}

        {(profile.role === "Lecturer" || profile.role === "Department Staff") && (
          <div className="form-group">
            <label>Office Location</label>
            <input
              name="office_location"
              value={form.office_location}
              onChange={handleChange}
              placeholder="Enter office location"
            />
          </div>
        )}

        <div className="form-group full-width">
          <label>Profile Image</label>
          <input
            type="file"
            name="profile_image"
            accept=".jpg,.jpeg,.png"
            onChange={handleChange}
          />
          <small>Allowed: JPG, JPEG, PNG. Maximum size: 2MB.</small>
        </div>
      </>
    );
  };

  return (
    <DashboardLayout>
      <div className="profile-page">
        <div className="page-header-row">
          <div>
            <h1>My Profile</h1>
            <p>View your account information and role-specific academic profile.</p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        {loading ? (
          <p className="table-message">Loading profile...</p>
        ) : profile ? (
          <div className="profile-grid">
            <div className="profile-card">
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Profile"
                  className="profile-image"
                />
              ) : (
                <div className="profile-avatar">
                  {profile.first_name?.charAt(0)}
                  {profile.last_name?.charAt(0)}
                </div>
              )}

              <h2>
                {profile.first_name} {profile.last_name}
              </h2>

              <p>{profile.email}</p>

              <span className="role-pill">{profile.role}</span>

              {profile.must_change_password && (
                <div className="warning-box">
                  You are using a temporary password. Please change it.
                </div>
              )}
            </div>

            <div className="profile-card large-card">
              <h3>Account Details</h3>

              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>First Name</label>
                    <input
                      name="first_name"
                      value={form.first_name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Last Name</label>
                    <input
                      name="last_name"
                      value={form.last_name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Email</label>
                    <input value={profile.email} disabled />
                  </div>

                  <div className="form-group">
                    <label>Role</label>
                    <input value={profile.role} disabled />
                  </div>

                  {renderEditableRoleFields()}
                </div>

                <button className="primary-btn" type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Update Profile"}
                </button>
              </form>
            </div>

            <div className="profile-card full-width-card">
              <h3>Role-Specific Details</h3>

              {!profile.profile ? (
                <p className="empty-text">No role-specific profile details found.</p>
              ) : (
                <div className="details-grid">
                  {visibleProfileEntries().map(([key, value]) => (
                    <div className="detail-item" key={key}>
                      <span>{getReadableLabel(key)}</span>
                      <strong>{value || "-"}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="table-message">No profile found.</p>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;