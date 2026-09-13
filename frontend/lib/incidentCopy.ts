import type { IncidentStatus } from "@/types";

export function getStudentStatusSummary(status: IncidentStatus): string {
  switch (status) {
    case "SUBMITTED":
      return "Your report has been received and is waiting for staff to review it.";
    case "UNDER_REVIEW":
      return "Staff are checking this report. You may be asked for more information.";
    case "VERIFIED":
      return "This report has been accepted and will be forwarded for action.";
    case "REJECTED":
      return "This report was not accepted. Review the admin reason below, update the details, and resubmit it.";
    case "FORWARDED_TO_DEAN":
      return "This report has been sent to the Dean for assignment.";
    case "ASSIGNED":
      return "A responsible official has been assigned to this report.";
    case "IN_PROGRESS":
      return "Work on this report is underway.";
    case "RESOLVED":
      return "The assigned official has reported this as resolved. The Dean will review it.";
    case "CLOSED":
      return "This report is closed.";
  }
}

export function getDeanStatusSummary(
  status: IncidentStatus,
  assignedOfficialName?: string | null,
): string {
  const official = assignedOfficialName?.trim();

  switch (status) {
    case "SUBMITTED":
    case "UNDER_REVIEW":
      return "Administrative staff are still reviewing this report.";
    case "VERIFIED":
      return "This report has been verified and is being prepared for assignment.";
    case "REJECTED":
      return "This report was rejected during administrative review.";
    case "FORWARDED_TO_DEAN":
      return "This report is waiting for you to assign a responsible official.";
    case "ASSIGNED":
      return official
        ? `Assigned to ${official}. Work has not started yet.`
        : "A responsible official has been assigned. Work has not started yet.";
    case "IN_PROGRESS":
      return official
        ? `${official} is currently working on this report.`
        : "Work on this report is currently underway.";
    case "RESOLVED":
      return official
        ? `${official} reported this as resolved. Review the work and close it, or return it.`
        : "The assigned official reported this as resolved. Review and close, or return it.";
    case "CLOSED":
      return "This incident is closed.";
  }
}

export function getStudentNextStep(status: IncidentStatus): string {
  switch (status) {
    case "SUBMITTED":
    case "UNDER_REVIEW":
      return "No action is needed from you unless staff send a message.";
    case "VERIFIED":
    case "FORWARDED_TO_DEAN":
      return "Staff will assign someone to handle this. You will see updates here.";
    case "ASSIGNED":
    case "IN_PROGRESS":
      return "You can send a message if you have more details for the assigned official.";
    case "RESOLVED":
      return "Wait for the Dean to confirm closure. You can still send a message if needed.";
    case "REJECTED":
      return "If you believe this was a mistake, contact university staff through the usual channels.";
    case "CLOSED":
      return "No further updates are expected on this report.";
  }
}
