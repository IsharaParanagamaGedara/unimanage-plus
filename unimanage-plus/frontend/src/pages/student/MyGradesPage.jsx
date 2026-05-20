import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { getMySubmissions } from "../../services/studentAssignmentService";
import "./MyGradesPage.css";

const MyGradesPage = () => {
  const [grades, setGrades] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadGrades = async () => {
    try {
      setLoading(true);
      setError("");

      const submissions = await getMySubmissions();

      const publishedGrades = submissions
        .filter((submission) => submission.grade)
        .map((submission) => ({
          submission_id: submission.id,
          assignment: submission.assignment,
          grade: submission.grade,
          submitted_at: submission.submitted_at,
        }));

      setGrades(publishedGrades);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load grades.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGrades();
  }, []);

  const filteredGrades = grades.filter((item) => {
    const keyword = search.toLowerCase();

    return (
      item.assignment?.title?.toLowerCase().includes(keyword) ||
      item.assignment?.course_batch?.course?.course_code?.toLowerCase().includes(keyword) ||
      item.assignment?.course_batch?.course?.course_name?.toLowerCase().includes(keyword) ||
      item.assignment?.course_batch?.batch_code?.toLowerCase().includes(keyword)
    );
  });

  const calculatePercentage = (marks, maxMarks) => {
    if (!marks || !maxMarks) return 0;
    return Math.round((Number(marks) / Number(maxMarks)) * 100);
  };

  return (
    <DashboardLayout>
      <div className="student-grades-page">
        <div className="page-header-row">
          <div>
            <h1>My Grades</h1>
            <p>View only approved and published grades with lecturer feedback.</p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="grades-summary-grid">
          <div className="summary-card">
            <span>Published Grades</span>
            <strong>{grades.length}</strong>
          </div>

          <div className="summary-card">
            <span>Average Percentage</span>
            <strong>
              {grades.length > 0
                ? Math.round(
                    grades.reduce(
                      (total, item) =>
                        total +
                        calculatePercentage(
                          item.grade?.marks,
                          item.assignment?.max_marks
                        ),
                      0
                    ) / grades.length
                  )
                : 0}
              %
            </strong>
          </div>

          <div className="summary-card">
            <span>Total Marks Earned</span>
            <strong>
              {grades.reduce((total, item) => total + Number(item.grade?.marks || 0), 0)}
            </strong>
          </div>

          <div className="summary-card">
            <span>Assignments Graded</span>
            <strong>{grades.length}</strong>
          </div>
        </div>

        <div className="filter-card">
          <input
            type="text"
            placeholder="Search by assignment, course, or batch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p className="table-message">Loading grades...</p>
        ) : filteredGrades.length === 0 ? (
          <div className="empty-card">
            <h3>No published grades found</h3>
            <p>Your grades will appear here after coordinator/admin approval.</p>
          </div>
        ) : (
          <div className="grades-card-grid">
            {filteredGrades.map((item) => {
              const percentage = calculatePercentage(
                item.grade?.marks,
                item.assignment?.max_marks
              );

              return (
                <div className="grade-card" key={item.submission_id}>
                  <div className="grade-card-header">
                    <div className="course-badge">
                      {item.assignment?.course_batch?.course?.course_code}
                    </div>

                    <span className="grade-percentage">{percentage}%</span>
                  </div>

                  <h3>{item.assignment?.title}</h3>

                  <p className="course-name">
                    {item.assignment?.course_batch?.course?.course_name}
                  </p>

                  <div className="grade-info-grid">
                    <div>
                      <span>Batch</span>
                      <strong>{item.assignment?.course_batch?.batch_name}</strong>
                    </div>

                    <div>
                      <span>Batch Code</span>
                      <strong>{item.assignment?.course_batch?.batch_code}</strong>
                    </div>

                    <div>
                      <span>Marks</span>
                      <strong>
                        {item.grade?.marks} / {item.assignment?.max_marks}
                      </strong>
                    </div>

                    <div>
                      <span>Published</span>
                      <strong>
                        {item.grade?.published_at
                          ? new Date(item.grade.published_at).toLocaleDateString()
                          : "-"}
                      </strong>
                    </div>
                  </div>

                  <div className="feedback-box">
                    <span>Lecturer Feedback</span>
                    <p>{item.grade?.feedback || "No feedback provided."}</p>
                  </div>

                  <div className="status-row">
                    <span className="status published">Published</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyGradesPage;