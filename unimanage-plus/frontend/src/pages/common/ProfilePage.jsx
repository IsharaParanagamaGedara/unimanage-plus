import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { getMyProfile, updateMyProfile } from "../../services/profileService";
import "./ProfilePage.css";

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMyProfile();

      setProfile(data);
      setForm({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
      });
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
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const data = await updateMyProfile(form);

      setProfile(data);
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const renderProfileDetails = () => {
    if (!profile?.profile) {
      return <p className="empty-text">No role-specific profile details found.</p>;
    }

    return Object.entries(profile.profile).map(([key, value]) => (
      <div className="detail-item" key={key}>
        <span>{key.replaceAll("_", " ")}</span>
        <strong>{value || "-"}</strong>
      </div>
    ));
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
              <div className="profile-avatar">
                {profile.first_name?.charAt(0)}
                {profile.last_name?.charAt(0)}
              </div>

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
                </div>

                <button className="primary-btn" type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Update Profile"}
                </button>
              </form>
            </div>

            <div className="profile-card full-width-card">
              <h3>Role-Specific Details</h3>

              <div className="details-grid">{renderProfileDetails()}</div>
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