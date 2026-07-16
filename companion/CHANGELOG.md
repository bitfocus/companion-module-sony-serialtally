# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2026-07-16

### Added

- Presets for M/E PGM sources, AUX sources, Macros (recalls and take button), and Auto Transitions.
- "Set Source Name" and "Refresh Source Names" actions.
- "Source is Tallied" feedback.
- Tally variables (sources list, counts, and per-source tally membership status).

### Changed

- Some logs migrated to verbose debug logs to reduce log noise.
- Spacings in dropdown labels updated to be consistent.
- Allow for faster Update Interval Rate (down to 100ms) in config.
- Feedbacks are only checked when applicable to the incoming message type.

### Fixed

- Timer cleanup issues where reconnect/polling timers were not cleared properly during config updates.

## [1.3.1] - 2024-11-04

### Fixed

- ME crosspoint change callback to properly use the user-configured interval rate instead of a hardcoded 500ms delay.

## [1.3.0] - 2024-11-04

### Added

- Configurable poll interval rate option to settings.
- Config option to enable or disable custom command actions.

## [1.2.0] - 2024-06-25

### Added

- Reconnect interval/retries for lost TCP connections.

## [1.1.0] - 2024-06-13

### Added

- Copy M/E and Copy AUX actions.
- Source names variables.

## [1.0.3] - 2024-06-13

### Fixed

- Bus identification for M/E Key 3.

## [1.0.2] - 2024-06-13

### Fixed

- Key and Macro action registrations and callbacks.

### Added

- Additional actions details to help file.

## [1.0.1] - 2024-06-11

### Added

- Renamed module package to `sony-serialtally`.
- Partial virtual GPIO support.

## [1.0.0] - 2024-06-03

### Added

- Initial Release supporting XVS serial tally protocol connection, M/E Crosspoint (XPT) selection, AUX/FM XPT selection, Transitions, Keyers, Snapshots, and Macros.
