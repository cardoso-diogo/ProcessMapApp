# Process Map Builder

Process Map Builder is an offline-first editor for layered manufacturing and
business process maps. It runs directly in a browser and can also be packaged
as a Windows desktop application with Tauri.

The included map is fictional training data. No production or company-specific
process information is bundled with the public project.

## Features

- Create phases, operations, groups, and subgroups.
- Attach inputs and outputs to an operation or share them across a group.
- Edit requirements, equipment, process parameters, defects, monitoring, SPC,
  and other configurable layers.
- Use multiline titles, subtitles, and flow labels.
- Export maps to SVG, PNG, and single-page or tiled PDF files.
- Save and reopen project files locally; project data is not sent to a server.
- Undo and redo up to 80 editing states.

## Run in a browser

Clone or download the repository, then open `app/index.html` in a modern
browser. No dependency installation or build step is required.

When saving a project, supported browsers display a native file picker. Other
browsers download the project JSON file instead.

## Publish the web application

The included GitHub Pages workflow deploys the contents of `app/` after every
push to `main`. Once Pages is enabled with **GitHub Actions** as its source, the
browser edition is available at:

```text
https://<account>.github.io/ProcessMapApp/
```

This is the simplest distribution option for teammates: they only need the
URL, while all project data continues to be saved locally in their browser or
chosen files.

## Build the Windows application

Install the current stable Rust toolchain, then run:

```powershell
Set-Location src-tauri
cargo install tauri-cli --version "^2" --locked
cargo tauri build
```

Build output is written under `src-tauri/target/release`. Pushing a version tag
such as `v1.1.0` triggers the included workflow and publishes a portable Windows
x64 executable, together with its SHA-256 checksum, on the repository's
**Releases** page. The executable is currently unsigned, so Windows SmartScreen
may display a warning when it is first downloaded and opened.

## Tests

Open `app/ProcessMap_Tests.html` in a browser. The page title and summary show
whether the browser-based regression suite passed.

For a quick syntax check when Node.js is available:

```powershell
node --check app/ProcessMap_Core.js
node --check app/ProcessMap_UI.js
node --check app/ProcessMap_Export.js
node --check app/ProcessMap_Tests.js
```

## Project layout

- `app/` — framework-free HTML, CSS, and JavaScript application.
- `src-tauri/` — lightweight Tauri v2 desktop wrapper.
- `.github/workflows/` — Windows desktop build automation.

## Data and privacy

The application is designed to work offline. Maps may contain sensitive
operational information, so review every project file before sharing it or
committing it to a repository. Saved project JSON files are not required to run
the application and should normally remain outside the source tree.

## Contributing

Bug reports and focused pull requests are welcome. Please avoid including real
company names, production parameters, controlled documents, or other
confidential information in examples, screenshots, tests, and issue reports.

## License

Released under the [MIT License](LICENSE).
