
# 教會輪值表編排工具 (Church Duty Roster Scheduler)

A web-based tool for automatically scheduling church service duties, considering individual availability, roles, and preferences.

## Features

- **Role Management**: Supports worship leader, pianist, drummer, guitarist, bassist, and backing vocals
- **Personnel Management**: 
  - Add/edit church members and their roles
  - Set unavailable dates
  - Configure service limits per role
- **Scheduling**:
  - Automatic roster generation
  - Considers individual availability
  - Respects role limits and preferences
- **Constraints**:
  - Set "cannot serve together" pairs
  - Set "prefer to serve together" pairs
- **Data Management**:
  - Import/Export data via CSV
  - Local storage for settings

## Usage

1. Add personnel with their roles and unavailable dates
2. Set any service constraints or preferences
3. Generate roster by selecting date range
4. Export roster to CSV

## Tech Stack

- HTML/CSS/JavaScript
- Local Storage for data persistence
- Browser-based, no server required

## License

MIT
