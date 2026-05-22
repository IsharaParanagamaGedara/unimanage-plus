import api from "./api";

const downloadCsv = async (url, fileName) => {
  const response = await api.get(url, {
    responseType: "blob",
  });

  const blob = new Blob([response.data], { type: "text/csv" });
  const downloadUrl = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = downloadUrl;
  link.setAttribute("download", fileName);

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(downloadUrl);
};

export const downloadStudentReport = () =>
  downloadCsv("/admin/reports/students/export", "student_list_report.csv");

export const downloadEnrollmentReport = () =>
  downloadCsv("/admin/reports/enrollments/export", "course_enrollment_report.csv");

export const downloadCourseApplicationReport = () =>
  downloadCsv("/admin/reports/course-applications/export", "course_application_report.csv");

export const downloadServiceRequestReport = () =>
  downloadCsv("/admin/reports/service-requests/export", "service_request_report.csv");

export const downloadSubmissionReport = () =>
  downloadCsv("/admin/reports/submissions/export", "assignment_submission_report.csv");

export const downloadGradeReport = () =>
  downloadCsv("/admin/reports/grades/export", "grade_report.csv");