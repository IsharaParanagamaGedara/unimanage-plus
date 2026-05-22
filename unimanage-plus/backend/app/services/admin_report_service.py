import csv
import io
from app.models.student import Student
from app.models.lecturer import Lecturer
from app.models.course import Course
from app.models.course_batch import CourseBatch
from app.models.course_application import CourseApplication
from app.models.batch_enrollment import BatchEnrollment
from app.models.service_request import ServiceRequest
from app.models.assignment_submission import AssignmentSubmission
from app.models.grade import Grade


class AdminReportService:

    @staticmethod
    def generate_csv(headers, rows):
        output = io.StringIO()
        writer = csv.writer(output)

        writer.writerow(headers)
        writer.writerows(rows)

        output.seek(0)
        return output

    @staticmethod
    def student_report():
        headers = [
            "Student Number",
            "First Name",
            "Last Name",
            "Email",
            "Academic Email",
            "Department",
            "Programme",
            "Year of Study",
            "Enrollment Date",
        ]

        students = Student.query.all()

        rows = [
            [
                student.student_number,
                student.user.first_name if student.user else "",
                student.user.last_name if student.user else "",
                student.user.email if student.user else "",
                student.academic_email,
                student.department.name if student.department else "",
                student.programme_name,
                student.year_of_study,
                student.enrollment_date,
            ]
            for student in students
        ]

        return AdminReportService.generate_csv(headers, rows)

    @staticmethod
    def enrollment_report():
        headers = [
            "Student Number",
            "Student Name",
            "Course Code",
            "Course Name",
            "Batch Code",
            "Batch Name",
            "Enrollment Status",
            "Enrolled At",
        ]

        enrollments = BatchEnrollment.query.all()

        rows = []

        for enrollment in enrollments:
            student = enrollment.student
            user = student.user if student else None
            batch = enrollment.batch
            course = batch.course if batch else None

            rows.append([
                student.student_number if student else "",
                f"{user.first_name} {user.last_name}" if user else "",
                course.course_code if course else "",
                course.course_name if course else "",
                batch.batch_code if batch else "",
                batch.batch_name if batch else "",
                enrollment.enrollment_status,
                enrollment.enrolled_at,
            ])

        return AdminReportService.generate_csv(headers, rows)

    @staticmethod
    def course_application_report():
        headers = [
            "Application ID",
            "Student Number",
            "Student Name",
            "Course Code",
            "Course Name",
            "Batch Code",
            "Batch Name",
            "Status",
            "Applied At",
            "Reviewed At",
            "Review Note",
        ]

        applications = CourseApplication.query.all()

        rows = []

        for application in applications:
            student = application.student
            user = student.user if student else None
            batch = application.batch
            course = batch.course if batch else None

            rows.append([
                application.id,
                student.student_number if student else "",
                f"{user.first_name} {user.last_name}" if user else "",
                course.course_code if course else "",
                course.course_name if course else "",
                batch.batch_code if batch else "",
                batch.batch_name if batch else "",
                application.status,
                application.applied_at,
                application.reviewed_at,
                application.review_note,
            ])

        return AdminReportService.generate_csv(headers, rows)

    @staticmethod
    def service_request_report():
        headers = [
            "Request ID",
            "Student Number",
            "Student Name",
            "Request Type",
            "Subject",
            "Priority",
            "Status",
            "Assigned To",
            "Submitted At",
            "Resolved At",
            "Resolution Note",
        ]

        requests = ServiceRequest.query.all()

        rows = []

        for request_item in requests:
            student = request_item.student
            student_user = student.user if student else None
            assigned_user = request_item.assigned_user

            rows.append([
                request_item.id,
                student.student_number if student else "",
                f"{student_user.first_name} {student_user.last_name}" if student_user else "",
                request_item.request_type,
                request_item.subject,
                request_item.priority,
                request_item.status,
                f"{assigned_user.first_name} {assigned_user.last_name}" if assigned_user else "",
                request_item.submitted_at,
                request_item.resolved_at,
                request_item.resolution_note,
            ])

        return AdminReportService.generate_csv(headers, rows)

    @staticmethod
    def assignment_submission_report():
        headers = [
            "Submission ID",
            "Student Number",
            "Student Name",
            "Assignment Title",
            "Course Code",
            "Course Name",
            "Batch Code",
            "Status",
            "Submitted At",
            "File Name",
        ]

        submissions = AssignmentSubmission.query.all()

        rows = []

        for submission in submissions:
            student = submission.student
            user = student.user if student else None
            assignment = submission.assignment
            batch = assignment.course_batch if assignment else None
            course = batch.course if batch else None

            rows.append([
                submission.id,
                student.student_number if student else "",
                f"{user.first_name} {user.last_name}" if user else "",
                assignment.title if assignment else "",
                course.course_code if course else "",
                course.course_name if course else "",
                batch.batch_code if batch else "",
                submission.status,
                submission.submitted_at,
                submission.file_name,
            ])

        return AdminReportService.generate_csv(headers, rows)

    @staticmethod
    def grade_report():
        headers = [
            "Grade ID",
            "Student Number",
            "Student Name",
            "Assignment Title",
            "Course Code",
            "Course Name",
            "Batch Code",
            "Marks",
            "Max Marks",
            "Grade Status",
            "Feedback",
            "Graded At",
            "Published At",
        ]

        grades = Grade.query.all()

        rows = []

        for grade in grades:
            submission = grade.submission
            student = submission.student if submission else None
            user = student.user if student else None
            assignment = submission.assignment if submission else None
            batch = assignment.course_batch if assignment else None
            course = batch.course if batch else None

            rows.append([
                grade.id,
                student.student_number if student else "",
                f"{user.first_name} {user.last_name}" if user else "",
                assignment.title if assignment else "",
                course.course_code if course else "",
                course.course_name if course else "",
                batch.batch_code if batch else "",
                grade.marks,
                assignment.max_marks if assignment else "",
                grade.status,
                grade.feedback,
                grade.graded_at,
                grade.published_at,
            ])

        return AdminReportService.generate_csv(headers, rows)