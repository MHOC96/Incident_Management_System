import type { IncidentStatus } from "@/types";

export function getStudentStatusSummary(status: IncidentStatus): string {
  switch (status) {
    case "SUBMITTED":
      return "Your case has been received and is waiting for the administrator to review it.";
    case "UNDER_REVIEW":
      return "The administrator is checking this case. You may be asked for more information.";
    case "NOT_STARTED":
      return "This case has been accepted and is waiting to be assigned to a relevant authority.";
    case "REJECTED":
      return "This case was not accepted. Review the reason below, update the details, and resubmit if needed.";
    case "ASSIGNED":
      return "A relevant authority has been assigned to this case.";
    case "IN_PROGRESS":
      return "Work on this case is underway.";
    case "WAITING_FOR_INFORMATION":
      return "More information is needed before work can continue.";
    case "RESOLVED":
      return "The assigned authority has marked this case as solved. The administrator will review and close it.";
    case "REOPENED":
      return "This case was reopened and will be assigned again.";
    case "CLOSED":
      return "This case is closed.";
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
      return "The administrator is still reviewing this case.";
    case "NOT_STARTED":
      return "This case is waiting for the administrator to assign a relevant authority.";
    case "REJECTED":
      return "This case was rejected during administrative review.";
    case "ASSIGNED":
      return official
        ? `Assigned to ${official}.`
        : "This case has been assigned to a relevant authority.";
    case "IN_PROGRESS":
      return official
        ? `${official} is currently working on this case.`
        : "Work on this case is currently underway.";
    case "WAITING_FOR_INFORMATION":
      return "Waiting for information from the reporter or authority.";
    case "RESOLVED":
      return official
        ? `${official} marked this case as solved. The administrator may close it.`
        : "The assigned authority marked this case as solved.";
    case "REOPENED":
      return "This case was reopened and awaits reassignment.";
    case "CLOSED":
      return "This case is closed.";
  }
}

export function getStudentNextStep(status: IncidentStatus): string {
  switch (status) {
    case "SUBMITTED":
    case "UNDER_REVIEW":
      return "No action is needed from you unless staff send a message.";
    case "NOT_STARTED":
    case "ASSIGNED":
    case "IN_PROGRESS":
      return "You can send a message if you have more details for the assigned authority.";
    case "WAITING_FOR_INFORMATION":
      return "Please respond if staff have asked for more information.";
    case "RESOLVED":
      return "Wait for the administrator to close the case. You can still send a message if needed.";
    case "REOPENED":
      return "The case will be handled again. No action is required unless staff contact you.";
    case "REJECTED":
      return "If you believe this was a mistake, contact faculty staff through the usual channels.";
    case "CLOSED":
      return "No further updates are expected on this case.";
  }
}
