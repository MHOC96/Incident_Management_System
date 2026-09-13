## Content scope clarification — 8 September 2026

Use sjp.ac.lk only as a visual reference. Do not copy its services or unrelated
content. Retain its institutional colors, typography, logo treatment, navigation
styling, and footer styling. Show only incident-system navigation, account forms,
reports, and relevant workflow information. Do not add university resource links,
contact directories, marketing sections, repeated quick-service menus, or account
promotional sidebars. The homepage uses a simple title section and incident list.

# Current visual specification — 8 September 2026

The user requested a full frontend redesign to match https://www.sjp.ac.lk/.
This section supersedes conflicting visual guidance below; all security, role,
workflow, privacy, and accessibility requirements remain in effect.

- Reference inspected directly: maroon #800000 utility bar, yellow #F4D535 contact
  accent, white identity/navigation row, trilingual university logo, navy #192F59
  section headings, light gray supporting sections, and charcoal #181818 footer.
- Typography: self-hosted through Next.js font optimization; Open Sans for body
  copy and Poppins for headings/navigation. No serif interface typography.
- Shared content width: 1320px including 40px desktop gutters and 22px mobile
  gutters. Desktop masthead is 112px; navigation collapses at 1100px.
- Buttons and inputs use 2px corners; incident panels use square corners and
  restrained top borders. Semantic status colors remain distinct.
- Homepage: official campus image, readable text overlay, four quick-service
  links, live public incidents, reporting guidance, and student registration.
- Public directory and account pages use navy title bands. Role workspaces use
  compact role navigation, grouped statistics, tables, and operational panels.
- Mobile uses two-column service links and single-column content/forms, with
  account forms ahead of supporting information. Reduced motion is supported.
- Preserve backend API contracts and access controls. Do not replace incident
  content with university news or invent reports/statistics to fill layouts.

Asset provenance: existing trilingual logo and favicon were preserved.
The homepage image is from:
https://www.sjp.ac.lk/wp-content/uploads/2018/12/IMG_20181016_073800-magenta.jpg

---

# USJ Incident Reporting & Resolution Management System
## Premium Product Design Specification

**Institution:** University of Sri Jayewardenepura  
**Faculty Context:** Faculty of Management Studies and Commerce  
**Product Type:** University Incident Reporting & Resolution Management System  
**Frontend:** Next.js + React + Tailwind CSS  
**Backend:** Django + Django REST Framework  
**Primary Users:** Students, Faculty Administration, Dean, University Officials  
**Design Direction:** Institutional, premium, restrained, trustworthy, functional

---

# 1. Design Philosophy

This application must feel like an **official university information system**, not a generic startup dashboard.

The visual language should communicate:

- Trust
- Institutional authority
- Accountability
- Calmness
- Clarity
- Professionalism
- Reliability
- Academic credibility

The interface should feel appropriate for a real system used by:

- Students
- Administrative officers
- Faculty management
- The Dean
- Heads of Departments
- Maintenance officers
- Security officers
- Senior university officials

The product must **not** look like an AI-generated SaaS template.

## Core principle

> Institutional design over decorative design.

Every visual element must have a reason to exist.

Avoid adding visual elements simply because they make a screen look "modern".

---

# 2. Anti-AI-Slop Rules

The following patterns are explicitly prohibited unless there is a strong functional reason.

## Do NOT use

### Excessive gradients

Avoid:

```text
purple → blue
blue → cyan
orange → pink
multi-color hero backgrounds
```

The interface should rely primarily on:

- solid colors
- subtle borders
- carefully chosen neutrals
- restrained accent colors

---

### Glassmorphism

Do not use:

```text
backdrop-filter blur
transparent glass cards
frosted glass navigation
```

The application should feel like a serious institutional system.

---

### Excessive rounded corners

Do not make every component:

```text
border-radius: 9999px
```

or giant:

```text
rounded-3xl
rounded-full
```

Use modest corner radii.

Recommended:

```text
4px  → compact controls
6px  → buttons / inputs
8px  → cards
10px → larger containers
```

Pills should be reserved primarily for:

- Status
- Priority
- Categories
- Small filters

---

### Card overload

Do not put every piece of information inside an individual card.

Bad:

```text
┌──────────────┐
│ Total        │
└──────────────┘

┌──────────────┐
│ Pending      │
└──────────────┘

┌──────────────┐
│ Resolved     │
└──────────────┘

┌──────────────┐
│ Assigned     │
└──────────────┘
```

Prefer structured information grouped within one meaningful section.

---

### Giant hero headings

Do not use:

```text
REPORT.

FIX.

TRANSFORM.
```

or oversized marketing copy.

This is a university operational application, not a startup landing page.

---

### Decorative illustrations

Do not use:

- 3D illustrations
- cartoon characters
- random isometric graphics
- AI-generated people
- generic stock illustrations

Use real UI content instead.

---

### Excessive icon usage

Icons should support recognition, not decorate every line.

Use icons for:

- navigation
- actions
- statuses where useful
- alerts
- location
- revision and workflow actions

Do not place an icon beside every piece of text.

---

# 3. Brand Direction

The visual identity should take inspiration from the University of Sri Jayewardenepura's established institutional character rather than inventing a completely unrelated startup identity.

The UI should feel connected to the university without attempting to recreate the university crest everywhere.

## Brand expression

The application should communicate:

```text
Academic
Institutional
Modern
Responsible
Human
Reliable
```

Avoid:

```text
Playful
Gaming-style
Crypto-style
Startup-style
Luxury-fashion-style
Neon-tech-style
```

---

# 4. Color System

Use a restrained institutional palette.

## Primary

### University-inspired deep maroon

```text
Primary:
#7A1735
```

Use for:

- Primary actions
- Active navigation
- Important links
- Selected states
- Key interface emphasis

Do not use maroon as the background of entire screens.

---

## Secondary institutional gold

```text
Gold:
#C59A3D
```

Use sparingly for:

- Highlights
- Important indicators
- Selected decorative details
- Institutional accents

Gold should never dominate the interface.

---

## Primary surface

```text
Background:
#F7F7F5
```

This creates a warm institutional feeling instead of the sterile white appearance of many SaaS interfaces.

---

## Main surface

```text
Surface:
#FFFFFF
```

Used for:

- Tables
- Forms
- Panels
- Main content containers

---

## Text

### Primary text

```text
#202124
```

### Secondary text

```text
#62666B
```

### Muted text

```text
#85898E
```

---

## Borders

```text
#E3E4E5
```

Borders should be visible but subtle.

---

# 5. Semantic Colors

Semantic colors must be used consistently.

### Success

```text
#2F6B45
```

Used for:

```text
Resolved
Closed
Verified
Completed
Active
```

---

### Warning

```text
#9A6A16
```

Used for:

```text
Pending
Awaiting Review
Medium Priority
Attention Required
```

---

### Danger

```text
#A33A3A
```

Used for:

```text
Rejected
Critical
Failed
Suspended
```

---

### Information

```text
#345E7A
```

Used for:

```text
Information
Assigned
In Progress
System notices
```

Semantic colors must never become decorative gradients.

---

# 6. Typography

Typography should be professional and highly readable.

## Primary typeface

Use:

```text
Inter
```

for most interface content.

Recommended weights:

```text
400 Regular
500 Medium
600 Semibold
700 Bold
```

Avoid using too many font weights.

---

## Optional institutional display typeface

A restrained serif may be used only for limited institutional branding:

```text
Source Serif 4
```

For example:

```text
University of Sri Jayewardenepura
```

However, operational interface content should remain sans-serif.

---

# 7. Typography Scale

## Page title

```text
32px
font-weight: 600
line-height: 1.2
```

---

## Section heading

```text
22px
font-weight: 600
```

---

## Subsection

```text
18px
font-weight: 600
```

---

## Body

```text
15px
line-height: 1.6
```

---

## Secondary text

```text
14px
```

---

## Metadata

```text
13px
```

Use metadata for:

- timestamps
- reporter details
- IDs
- locations
- category information

---

# 8. Layout Philosophy

Use a structured editorial layout.

The interface should generally follow:

```text
┌───────────────────────────────────────────────────┐
│ Header                                             │
├───────────────┬───────────────────────────────────┤
│               │                                   │
│ Navigation    │ Main Content                      │
│               │                                   │
│               │                                   │
│               │                                   │
└───────────────┴───────────────────────────────────┘
```

The application should not feel like a collection of unrelated cards.

---

# 9. Public Website Layout

Public users do not need an account simply to view public incidents.

The landing page should be simple and institutional.

```text
University of Sri Jayewardenepura

Incident Reporting & Resolution

Report university-related issues and follow
their progress through the resolution process.

[ View Public Incidents ]   [ Report an Incident ]

--------------------------------------------------

Recent Public Incidents

Broken Classroom Door
Management Faculty · Block B
In Progress

Water Leakage
Management Faculty · Ground Floor
Resolved

--------------------------------------------------

University Incident Reporting System
```

The page should prioritize usefulness over marketing.

---

# 10. Header

The header should be approximately:

```text
Height: 68–76px
```

It should contain:

```text
University identity
System name
Public navigation
Authentication actions
```

Example:

```text
[USJ]
University of Sri Jayewardenepura
Incident Reporting

              Incidents    About    Login
```

The header should remain visually quiet.

---

# 11. Public Incident Directory

The public incident list should resemble an institutional records interface.

## Top area

```text
Public Incidents

Browse verified incidents that have been
marked as publicly visible.

[Search incidents...................]

Category [All]
Location [All]
Status [All]
```

---

## Incident rows

Prefer structured rows instead of giant cards.

```text
INC-2026-00142

Broken classroom door
Management Faculty · Block B

Maintenance
In Progress

08 September 2026
```

Use thin dividers between records.

---

# 12. Public Incident Detail

The page should prioritize information hierarchy.

```text
INC-2026-00142
Verified

Broken Classroom Door

Management Faculty
Block B · Second Floor

--------------------------------------------------

Description

The classroom door has sustained damage...

--------------------------------------------------

Incident Photo

[ image ]

--------------------------------------------------

Current Status

IN PROGRESS

--------------------------------------------------

Progress

Submitted
      │
Verified
      │
Assigned
      │
● In Progress
      │
Resolved
```

Do not expose:

- Student phone number
- MC number
- Private email
- Internal review notes
- Restricted information

---

# 13. Authentication Screens

Authentication screens should be extremely simple.

Avoid:

```text
huge colorful illustration + giant gradient background
```

Use:

```text
University identity

Student Account

Email
[____________________]

Password
[____________________]

[ Sign in ]

Forgot password?
```

The authentication experience should feel like an official university portal.

---

# 14. Student Dashboard

The student dashboard should focus on reporting and tracking.

Recommended layout:

```text
Good morning, Oshadha

Your reported incidents

--------------------------------------------------

3
Total Reports

1
Under Review

1
In Progress

1
Resolved

--------------------------------------------------

Recent Reports

INC-2026-00142
Broken Classroom Door
In Progress

INC-2026-00137
Water Leakage
Resolved

--------------------------------------------------

[ Report New Incident ]
```

Do not create ten different statistic cards.

---

# 15. Incident Submission

This is one of the most important screens.

The form should feel serious and guided.

```text
Report an Incident

Help the university identify and resolve an issue.

1. Incident Details

Title
[________________________________]

Category
[ Maintenance ▼ ]

Location
[ Select location ▼ ]

Description
[________________________________]
[________________________________]

2. Evidence

Upload an image
[ Choose photo ]

3. Visibility

○ Public
  The incident may be displayed publicly.

○ Private
  Visible only to authorized university personnel.

             [ Submit Incident ]
```

Use clear explanatory text.

---

# 16. Form Principles

Forms must:

- have clear labels
- use generous vertical spacing
- avoid unnecessary borders
- show validation inline
- explain required information
- preserve user input when validation fails

Never rely only on placeholder text as the label.

Bad:

```text
[ Enter incident title... ]
```

Good:

```text
Incident title
[_____________________]
```

---

# 17. Admin Dashboard

The administrator's primary goal is **verification**.

The dashboard should therefore emphasize pending incidents.

```text
Admin

Incident Review

--------------------------------------------------

Pending Verification
12

Verified
42

Rejected
5

--------------------------------------------------

Reports Awaiting Review

INC-2026-00142
Broken Classroom Door
08 Sep 2026

INC-2026-00141
Water Leakage
08 Sep 2026

INC-2026-00140
Damaged Window
07 Sep 2026
```

The admin should be able to open an incident and make a clear decision.

---

# 18. Admin Incident Review

Use a two-column layout on desktop.

```text
┌───────────────────────────┬─────────────────────┐
│ Incident Information     │ Review              │
│                           │                     │
│ Title                     │ Verification        │
│ Location                  │                     │
│ Description               │ [Verify]            │
│ Photo                     │ [Reject]            │
│ Reporter information      │ [Request Info]      │
└───────────────────────────┴─────────────────────┘
```

Do not visually overwhelm the administrator.

---

# 19. Dean Dashboard

The Dean is the **highest application authority**.

The Dean interface should therefore feel more authoritative, but not visually flashy.

Primary navigation:

```text
Overview
Incidents
Assignments
Users
Responsible Parties
Reports
Settings
```

The Dean should have full CRUD authority over appropriate system entities.

---

# 20. Dean Overview

Recommended structure:

```text
Faculty Incident Management

Current Situation

87 Total Incidents
12 Awaiting Action
23 In Progress
52 Resolved

--------------------------------------------------

Priority Incidents

INC-2026-00142
Security issue
HIGH

INC-2026-00139
Infrastructure damage
HIGH

--------------------------------------------------

Resolution Performance

Average Resolution Time
2.4 days
```

Use charts only where they communicate something useful.

---

# 21. User Management

The Dean can create and manage official accounts.

Students sign in with university MC and CPM numbers. They cannot self-register.

Officials do not self-register.

```text
Users

[+ Create Official Account]

Name
Role
Position
Status
Last Activity
Actions
```

Available actions:

```text
View
Edit
Deactivate
Reactivate
Reset Password
```

Prefer deactivation instead of deleting accounts tied to historical incidents.

---

# 22. Official Account Creation

The Dean should create an official account using an activation workflow.

```text
Create Official Account

Full Name
Official Email
Contact Number
Position
Department

[ Create Account ]
```

The official receives an activation link and creates their own password.

The Dean should never need to know another person's permanent password.

---

# 23. Official Dashboard

Officials should only see incidents assigned to them or otherwise authorized for their role.

Example:

```text
Maintenance Officer

Assigned to me

--------------------------------------------------

INC-2026-00142
Broken Classroom Door

Priority: High
Location: Block B

Assigned by:
Dean

Current Status:
Assigned

[ Open Incident ]
```

No system-wide administrative controls.

---

# 24. Incident Status System

Use a controlled workflow.

```text
SUBMITTED
    ↓
UNDER_REVIEW
    ↓
VERIFIED
    ↓
FORWARDED_TO_DEAN
    ↓
ASSIGNED
    ↓
IN_PROGRESS
    ↓
RESOLVED
    ↓
CLOSED
```

Rejection path:

```text
UNDER_REVIEW
    ↓
REJECTED
```

The UI should communicate status clearly.

---

# 25. Status Styling

Status should be shown as small restrained labels.

Example:

```text
● In Progress
```

or:

```text
[ IN PROGRESS ]
```

Do not use giant colorful status badges.

---

# 26. Priority System

Use:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

Priority must be visually distinguishable without becoming visually aggressive.

Example:

```text
LOW       subtle neutral
MEDIUM    restrained warning
HIGH      strong warning
CRITICAL  danger
```

Critical incidents may have a left border or small indicator rather than a giant red card.

---

# 27. Incident Timeline

The incident timeline is one of the system's most important components.

Example:

```text
Incident Timeline

08 Sep · 09:32
Incident submitted
Student

08 Sep · 10:10
Report verified
Admin

08 Sep · 11:30
Assigned to Maintenance Officer
Dean

08 Sep · 14:15
Work started
Maintenance Officer

09 Sep · 10:20
Resolution reported
Maintenance Officer

09 Sep · 11:00
Incident closed
Dean
```

Use a vertical line with simple markers.

Avoid exaggerated timeline graphics.

---

# 28. Communication

Communication should appear within the incident detail page.

Example:

```text
Communication

Maintenance Officer
09 Sep · 10:20

"Technician has replaced the damaged component."

Dean
09 Sep · 11:00

"Thank you. Please confirm the area is safe."

[ Write a message........................ ]

[ Send ]
```

Communication should be contextual to the incident.

---

# 29. Navigation

Desktop sidebar:

```text
Overview
Incidents
Assignments
Users
Responsible Parties
Reports
Settings
```

The sidebar should be narrow and functional.

Recommended width:

```text
240px ± 20px
```

Avoid overly decorative navigation.

---

# 30. Icons

Use a consistent icon library such as:

```text
Lucide
```

Icons should generally be:

```text
16px – 20px
```

Use icons for:

- navigation
- actions
- status support
- utility controls

Avoid using icons solely to fill empty space.

---

# 31. Buttons

Buttons must communicate hierarchy.

## Primary

```text
[ Submit Incident ]
```

Used for the primary action.

---

## Secondary

```text
[ Cancel ]
```

---

## Destructive

```text
[ Reject Incident ]
```

Use only when necessary.

---

## Button shape

Use modest corner radius:

```text
6px
```

Height:

```text
40px – 44px
```

Do not use giant pill buttons.

---

# 32. Tables

Administrative screens should use tables heavily where appropriate.

Example:

```text
Incident ID    Title              Status       Priority
---------------------------------------------------------
00142          Broken Door        In Progress  High
00141          Water Leakage      Resolved      Medium
00140          Damaged Window     Verified      Low
```

Tables should have:

- clean headers
- thin separators
- adequate row height
- hover feedback
- clear status indicators

Avoid zebra-striping unless necessary.

---

# 33. Cards

Cards are allowed but should be purposeful.

Use cards for:

- summary metrics
- focused information blocks
- important workflows
- media
- forms requiring separation

A card should not exist simply because "cards look modern."

---

# 34. Borders and Shadows

Prefer borders over shadows.

Recommended:

```text
border: 1px solid #E3E4E5
```

Shadows should be extremely subtle.

Avoid:

```text
huge drop shadows
floating neon cards
multiple shadow levels
```

Most containers should feel physically connected to the page.

---

# 35. Spacing System

Use a consistent spacing scale.

```text
4px
8px
12px
16px
20px
24px
32px
40px
48px
64px
```

Primary page content:

```text
32px – 40px
```

Between sections:

```text
32px
```

Between related fields:

```text
16px
```

---

# 36. Maximum Content Width

Public pages:

```text
1200px
```

Administrative application:

```text
1400px
```

The interface should not stretch infinitely across large screens.

---

# 37. Responsive Design

The system must work on:

```text
Mobile
Tablet
Laptop
Desktop
Large Desktop
```

## Mobile

Convert sidebar into:

```text
top navigation
or
slide-over navigation
```

Tables should become:

```text
stacked records
```

Forms should become one column.

---

# 38. Mobile Incident Reporting

Mobile reporting should be particularly efficient because students may report incidents while physically near the problem.

Recommended:

```text
Report Incident

Title
[________________]

Category
[ Maintenance ]

Location
[ Current / Select ]

Description
[________________]

Photo
[ Add Photo ]

Visibility
Public / Private

[ Submit Report ]
```

Keep the process short.

---

# 39. Image Upload UX

Because incidents may include photographs:

The upload component should support:

- image preview
- file validation
- upload progress
- remove image
- retry after failure

Example:

```text
Evidence

┌────────────────────┐
│                    │
│   Image Preview    │
│                    │
└────────────────────┘

building-damage.jpg

[ Remove ]
```

Do not make the upload interface visually complicated.

---

# 40. Empty States

Empty states must be useful.

Bad:

```text
No data
```

Good:

```text
No incidents found

There are no incidents matching the
current filters.
```

For students:

```text
You have not reported any incidents yet.

[ Report an Incident ]
```

---

# 41. Loading States

Prefer skeleton loading for substantial page content.

Example:

```text
██████████████████
████████████
████████████████
```

Avoid unnecessary spinning animations throughout the application.

---

# 42. Error States

Errors must explain the problem.

Bad:

```text
Something went wrong.
```

Better:

```text
We couldn't submit your incident.

Please check your connection and try again.
```

For permission errors:

```text
You don't have permission to access this incident.
```

---

# 43. Notifications

Notifications should be subtle.

Example:

```text
✓ Incident submitted successfully.
```

Use toast notifications primarily for:

- successful actions
- small temporary confirmations
- minor errors

Do not use pop-ups for every action.

---

# 44. Confirmation Dialogs

Use confirmation dialogs only for consequential operations.

Example:

```text
Reject Incident?

This incident will be marked as rejected.

Reason
[____________________________]

[ Cancel ]    [ Reject Incident ]
```

Do not ask for confirmation for harmless actions.

---

# 45. Search

Search should be fast and simple.

Search fields may support:

```text
Incident ID
Title
Location
Category
```

For administrators:

```text
Reporter
Assigned Official
Status
```

Search should be available where the volume of records justifies it.

---

# 46. Filtering

Use compact filter controls.

Example:

```text
Status
[ All ▼ ]

Category
[ All ▼ ]

Priority
[ All ▼ ]

Location
[ All ▼ ]
```

Do not create a large filter dashboard.

---

# 47. Dashboard Analytics

Analytics should be meaningful.

Recommended:

```text
Total incidents
Open incidents
Resolved incidents
Average resolution time
Incidents by category
Incidents by location
```

Avoid meaningless metrics such as:

```text
Engagement Score
Platform Health
AI Efficiency
User Happiness
```

unless the university actually has a reason to measure them.

---

# 48. Real-World Institutional Feel

The system should visually resemble:

```text
University Portal
+
Administrative Case Management
+
Modern Government Service
```

rather than:

```text
Startup SaaS Dashboard
```

This means:

- restrained colors
- clean tables
- strong typography
- predictable navigation
- clear records
- explicit statuses
- minimal decoration

---

# 49. Accessibility

The system must aim for WCAG 2.2 AA-level accessibility where practical.

Ensure:

- sufficient text contrast
- visible keyboard focus
- labels for all inputs
- accessible error messages
- keyboard navigation
- semantic HTML
- alt text for incident photographs where appropriate
- don't rely on color alone for status

Example:

Do not use only:

```text
RED = rejected
```

Use:

```text
● Rejected
```

---

# 50. Privacy by Design

The application contains personal information.

Public incidents must never expose:

```text
Student full contact number
MC number
Email
Internal review notes
Restricted incident details
```

Public records should contain only the information intended for public viewing.

Private incidents must be protected through backend authorization, not merely hidden in the frontend.

---

# 51. Authorization Principles

Frontend visibility is not security.

Every sensitive operation must be enforced by Django.

Examples:

```text
Student:
Can create incident

Student:
Can view own incidents

Admin:
Can verify incidents

Dean:
Can manage users

Dean:
Can assign incidents

Official:
Can update assigned incidents
```

Django REST Framework permissions must enforce these rules server-side.

---

# 52. Performance Philosophy

Do not optimize prematurely.

Initial architecture:

```text
Next.js
    ↓
Django REST API
    ↓
PostgreSQL
```

Images:

```text
Cloudinary
```

Caching:

```text
Optional
```

Redis:

```text
Not required initially
```

Rate limiting:

```text
Recommended
```

The system should remain simple until actual traffic requires additional infrastructure.

---

# 53. Animation

Animation should be restrained.

Use:

```text
150ms – 250ms
```

for:

- hover states
- modal appearance
- sidebar transitions
- dropdowns
- small state transitions

Avoid:

- bouncing cards
- excessive parallax
- spinning logos
- animated gradients
- decorative background movement

---

# 54. Hover States

Hover should be subtle.

Example:

```text
Default:
white background

Hover:
slightly darker neutral background

Active:
institutional accent indicator
```

No dramatic scaling.

---

# 55. Page Transitions

Avoid elaborate page transition animations.

Fast navigation is more important than animation.

Use smooth transitions only where they improve comprehension.

---

# 56. Logo and University Identity

Do not redesign the official University crest.

When an official university asset is available, use the supplied official asset.

Recommended placement:

```text
[ University Mark ]

University of Sri Jayewardenepura
Incident Reporting System
```

Do not put the crest repeatedly throughout the interface.

---

# 57. Photography

Use real university photographs only where they add actual value.

Suitable places:

- public landing page
- institutional introduction
- location reference

Avoid generic stock photos.

Do not use AI-generated university buildings as fake representations of the institution.

---

# 58. Public vs Private Incidents

Visibility must be clearly communicated.

Public:

```text
PUBLIC
```

Private:

```text
PRIVATE
```

Restricted:

```text
RESTRICTED
```

Private/restricted information must never accidentally appear in public APIs.

---

# 59. Responsible Party Management

The Dean can manage responsible parties.

Example:

```text
Responsible Parties

Maintenance Division
Security Division
Heads of Department
Vice Chancellor's Office
Other Authorized Officials
```

The Dean can:

```text
Create
Read
Update
Deactivate
```

Officials can then be assigned to incidents.

---

# 60. Role Hierarchy

The application's authority hierarchy should be:

```text
DEAN
 │
 ├── ADMIN
 │
 ├── OFFICIAL
 │      ├── Vice Chancellor
 │      ├── HOD
 │      ├── Maintenance Officer
 │      ├── Security Officer
 │      └── Other
 │
 └── STUDENT
```

However, this should represent **application permissions**, not an attempt to recreate the University's entire institutional hierarchy.

---

# 61. Dean Experience

The Dean should always be able to answer four questions immediately:

```text
1. What incidents require my attention?

2. Who is responsible for each incident?

3. Which incidents are overdue?

4. Which incidents have been resolved?
```

The interface should therefore prioritize these questions over vanity metrics.

---

# 62. Incident Detail — Master Layout

The ideal desktop layout:

```text
┌─────────────────────────────────────────────────────────┐
│ INC-2026-00142                          HIGH             │
│ Broken Classroom Door                                   │
│ Management Faculty · Block B                            │
├─────────────────────────────────┬───────────────────────┤
│                                 │ Current Status        │
│ Description                     │ IN PROGRESS           │
│                                 │                       │
│ Incident Photo                  │ Assigned To           │
│                                 │ Maintenance Officer   │
│                                 │                       │
│                                 │ Priority              │
│                                 │ HIGH                  │
├─────────────────────────────────┴───────────────────────┤
│ Incident Timeline                                        │
│                                                         │
│ Submitted                                               │
│    │                                                    │
│ Verified                                                │
│    │                                                    │
│ Assigned                                                │
│    │                                                    │
│ In Progress                                             │
│    │                                                    │
│ Resolved                                                │
└─────────────────────────────────────────────────────────┘
```

This should be the visual foundation for incident management.

---

# 63. Design Tokens

Centralize design tokens.

```css
:root {
  --color-primary: #7A1735;
  --color-primary-dark: #62132B;

  --color-accent: #C59A3D;

  --color-background: #F7F7F5;
  --color-surface: #FFFFFF;

  --color-text: #202124;
  --color-text-secondary: #62666B;
  --color-text-muted: #85898E;

  --color-border: #E3E4E5;

  --color-success: #2F6B45;
  --color-warning: #9A6A16;
  --color-danger: #A33A3A;
  --color-info: #345E7A;

  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
}
```

These values should be centralized rather than repeatedly invented throughout the project.

---

# 64. Component Architecture

Recommended frontend structure:

```text
components/
│
├── layout/
│   ├── Header
│   ├── Sidebar
│   └── PageContainer
│
├── ui/
│   ├── Button
│   ├── Input
│   ├── Select
│   ├── Badge
│   ├── Dialog
│   ├── Table
│   ├── Pagination
│   └── Toast
│
├── incidents/
│   ├── IncidentRow
│   ├── IncidentCard
│   ├── IncidentTimeline
│   ├── IncidentStatus
│   ├── IncidentPriority
│   ├── IncidentFilters
│   └── IncidentForm
│
├── dashboard/
│   ├── SummaryMetric
│   ├── IncidentTable
│   └── Analytics
│
└── users/
    ├── UserTable
    ├── UserForm
    └── RoleBadge
```

Components should be reusable and semantically named.

---

# 65. Next.js Page Organization

Recommended conceptual structure:

```text
app/

├── page.tsx
│
├── incidents/
│   ├── page.tsx
│   └── [id]/
│       └── page.tsx
│
├── login/
│   └── page.tsx
│
├── register/
│   └── page.tsx
│
├── student/
│   ├── dashboard/
│   └── incidents/
│
├── admin/
│   ├── dashboard/
│   └── incidents/
│
├── dean/
│   ├── dashboard/
│   ├── users/
│   ├── assignments/
│   └── responsible-parties/
│
└── official/
    ├── dashboard/
    └── incidents/
```

The exact routing structure can evolve, but role boundaries should remain obvious.

---

# 66. Design Quality Checklist

Before accepting any UI screen, ask:

### Institutional test

> Would this look credible if displayed on a university administration computer?

### Clarity test

> Can a first-time user understand what to do within five seconds?

### Restraint test

> Can any decorative element be removed without reducing functionality?

If yes, remove it.

### Consistency test

> Does this component behave like equivalent components elsewhere?

### Accessibility test

> Can the screen be used without relying only on color or mouse interaction?

### Information hierarchy test

> Is the most important information visually strongest?

---

# 67. Forbidden Visual Patterns

The following should not appear without explicit design justification:

```text
❌ Purple gradient hero
❌ Neon blue buttons
❌ Glassmorphism cards
❌ Floating 3D illustrations
❌ Excessive rounded cards
❌ Giant emoji icons
❌ Animated blobs
❌ AI-generated people
❌ Decorative dashboard charts
❌ Excessive shadows
❌ Random color combinations
❌ Giant marketing typography
❌ Excessive badges
❌ Every section inside a card
❌ Excessive animation
❌ "AI assistant" aesthetics
```

---

# 68. Desired Visual Result

The final interface should feel like:

```text
University administration
        +
Professional case management
        +
Modern web application
```

The user should think:

> "This looks like an official University of Sri Jayewardenepura system."

Not:

> "This looks like an AI-generated dashboard."

---

# 69. Final Design Summary

The design should be:

```text
RESTRAINED
      +
INSTITUTIONAL
      +
MODERN
      +
HIGHLY USABLE
      +
ACCESSIBLE
      +
TRUSTWORTHY
```

Primary visual language:

```text
Warm off-white background
White surfaces
Deep institutional maroon
Limited gold accents
Dark typography
Subtle borders
Minimal shadows
Moderate radius
Strong information hierarchy
```

The product should prioritize:

```text
Incident clarity
Status visibility
Responsibility
Resolution
Communication
Privacy
Operational efficiency
```

Above all:

> **The interface should look like software commissioned by a university, not software generated from a generic SaaS template.**

# 70. Implementation Rule

When building any new screen, developers must first ask:

```text
1. What is the user's task?
2. What information is essential?
3. What action is most important?
4. What can be removed?
```

Only after answering these questions should visual styling be introduced.

Functionality and information hierarchy always take priority over decoration.
