import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import DashboardLayout from "../../layouts/DashboardLayout";
import { getAdminAnalyticsOverview } from "../../services/adminAnalyticsService";
import { getDepartments } from "../../services/adminDepartmentService";
import { getCourses } from "../../services/adminCourseService";
import { getCourseBatches } from "../../services/adminCourseBatchService";
import "./AdminAnalyticsPage.css";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2"];

const initialFilters = {
  department_id: "",
  course_id: "",
  batch_id: "",
  start_date: "",
  end_date: "",
  month: "",
  year: "",
};

const kpiLabels = {
  total_students: "Total Students",
  total_lecturers: "Total Lecturers",
  total_courses: "Total Courses",
  total_batches: "Total Batches",
  pending_applications: "Pending Applications",
  approved_enrollments: "Approved Enrollments",
  pending_service_requests: "Pending Service Requests",
  published_assignments: "Published Assignments",
  total_submissions: "Total Submissions",
  published_grades: "Published Grades",
};

const AdminAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);

  const [loading, setLoading] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  const [error, setError] = useState("");

  const loadFilterData = async () => {
    try {
      setFilterLoading(true);

      const [departmentData, courseData, batchData] = await Promise.all([
        getDepartments(),
        getCourses(),
        getCourseBatches(),
      ]);

      setDepartments(departmentData.filter((item) => item.is_active));
      setCourses(courseData.filter((item) => item.is_active));
      setBatches(batchData.filter((item) => item.is_active));
    } catch (err) {
      setError("Failed to load analytics filter data.");
    } finally {
      setFilterLoading(false);
    }
  };

  const loadAnalytics = async (selectedFilters = filters) => {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminAnalyticsOverview(selectedFilters);
      setAnalytics(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFilterData();
    loadAnalytics(initialFilters);
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    setFilters((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };

      if (name === "department_id") {
        updated.course_id = "";
        updated.batch_id = "";
      }

      if (name === "course_id") {
        updated.batch_id = "";
      }

      return updated;
    });
  };

  const handleApplyFilters = () => {
    loadAnalytics(filters);
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
    loadAnalytics(initialFilters);
  };

  const filteredCourses = filters.department_id
    ? courses.filter(
        (course) => Number(course.department_id) === Number(filters.department_id)
      )
    : courses;

  const filteredBatches = filters.course_id
    ? batches.filter((batch) => Number(batch.course_id) === Number(filters.course_id))
    : batches;

  const formatStatusData = (items = []) =>
    items.map((item) => ({
      name: item.status || "Unknown",
      value: item.count,
    }));

  const formatCoursePopularity = (items = []) =>
    items.map((item) => ({
      name: item.course_code,
      enrollments: item.enrollment_count,
      course_name: item.course_name,
    }));

  return (
    <DashboardLayout>
      <div className="admin-analytics-page">
        <div className="page-header-row">
          <div>
            <h1>Analytics Dashboard</h1>
            <p>
              Monitor academic activity, service workflows, assignments, grades,
              and enrollments with filter-based insights.
            </p>
          </div>

          <button className="primary-btn" onClick={() => loadAnalytics(filters)}>
            Refresh
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="analytics-filter-card">
          <div className="filter-title-row">
            <div>
              <h3>Analytics Filters</h3>
              <p>Filter KPIs and charts by department, course, batch, or date period.</p>
            </div>

            <button className="secondary-btn" onClick={handleClearFilters}>
              Clear Filters
            </button>
          </div>

          <div className="analytics-filter-grid">
            <div className="form-group">
              <label>Department</label>
              <select
                name="department_id"
                value={filters.department_id}
                onChange={handleFilterChange}
                disabled={filterLoading}
              >
                <option value="">All Departments</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Course</label>
              <select
                name="course_id"
                value={filters.course_id}
                onChange={handleFilterChange}
                disabled={filterLoading}
              >
                <option value="">All Courses</option>
                {filteredCourses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.course_code} - {course.course_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Course Batch</label>
              <select
                name="batch_id"
                value={filters.batch_id}
                onChange={handleFilterChange}
                disabled={filterLoading}
              >
                <option value="">All Batches</option>
                {filteredBatches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.batch_code} - {batch.batch_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                name="start_date"
                value={filters.start_date}
                onChange={handleFilterChange}
              />
            </div>

            <div className="form-group">
              <label>End Date</label>
              <input
                type="date"
                name="end_date"
                value={filters.end_date}
                onChange={handleFilterChange}
              />
            </div>

            <div className="form-group">
              <label>Month</label>
              <select name="month" value={filters.month} onChange={handleFilterChange}>
                <option value="">All Months</option>
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            </div>

            <div className="form-group">
              <label>Year</label>
              <input
                type="number"
                name="year"
                placeholder="2026"
                value={filters.year}
                onChange={handleFilterChange}
              />
            </div>
          </div>

          <div className="filter-actions">
            <button className="primary-btn" onClick={handleApplyFilters} disabled={loading}>
              {loading ? "Loading..." : "Apply Filters"}
            </button>
          </div>
        </div>

        {loading ? (
          <p className="table-message">Loading analytics...</p>
        ) : analytics ? (
          <>
            <div className="analytics-kpi-grid">
              {Object.entries(analytics.kpis || {}).map(([key, value]) => (
                <div className="analytics-kpi-card" key={key}>
                  <span>{kpiLabels[key] || key}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>

            <div className="analytics-chart-grid">
              <div className="chart-card">
                <h3>Applications by Status</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={formatStatusData(analytics.charts?.applications_by_status)}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={90}
                      label
                    >
                      {formatStatusData(analytics.charts?.applications_by_status).map(
                        (_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        )
                      )}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <h3>Service Requests by Status</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={formatStatusData(analytics.charts?.service_requests_by_status)}>
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <h3>Assignments by Status</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={formatStatusData(analytics.charts?.assignments_by_status)}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={90}
                      label
                    >
                      {formatStatusData(analytics.charts?.assignments_by_status).map(
                        (_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        )
                      )}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <h3>Grades by Status</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={formatStatusData(analytics.charts?.grades_by_status)}>
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#16a34a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card full-width-chart">
                <h3>Course Popularity by Enrollment Count</h3>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={formatCoursePopularity(analytics.charts?.course_popularity)}>
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip
                      formatter={(value, name, item) => [
                        value,
                        `${item.payload.course_name}`,
                      ]}
                    />
                    <Bar dataKey="enrollments" fill="#7c3aed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : (
          <p className="table-message">No analytics data found.</p>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminAnalyticsPage;