# Agenda Requirements

## Overview

A unified calendar and task manager. The key idea: tasks without a scheduled time float into available calendar slots, so your day view always reflects what you can realistically get done.

## Views

- **Day** — primary view; shows time-blocked events alongside unscheduled tasks fitted into free time
- **Week** — grid of 7 days; events and tasks visible at a glance
- **Month** — overview; events shown, tasks summarized per day

## Events

- Title, date, start/end time (or all-day toggle)
- Optional: description, location, recurrence (daily/weekly/monthly)
- Create, edit, delete

## Tasks

- Title, optional due date, optional duration estimate
- Status: open / done
- priority: low / medium / high
- due date is optional; if set, task should be scheduled into calendar before due date

## Task Scheduling

- Tasks are dynamically scheduled into free time slots in the calendar
- Scheduling algorithm considers task duration, priority, and due date

## Projects and Reserved Time
- Tasks can be grouped into projects for better organization
- Users can reserve time for projects, which creates blocked time slots in the calendar
- Tasks within a project will be scheduled into these allocated time slots

## UI

- Mobile-first, responsive layout
- Consistent with the rest of the Fleaoffice suite (minimal, clean)
- Drag-and-drop for rescheduling events and tasks
- Quick add for tasks and events