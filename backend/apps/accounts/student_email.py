from apps.common.validators import normalize_mc_number

STUDENT_EMAIL_DOMAIN = "mgt.sjp.ac.lk"


def student_email_from_mc(mc_number: str) -> str:
    """University student email: {mc_number}@mgt.sjp.ac.lk (local part lowercased)."""
    local_part = normalize_mc_number(mc_number).lower()
    return f"{local_part}@{STUDENT_EMAIL_DOMAIN}"
