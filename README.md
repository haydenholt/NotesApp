# Timer Notes

A web-based note-taking application with time tracking and text comparison features.

## Features

- **Note Taking**: Create and manage notes with timestamps
- **Feedback**: Auto-format feedback with Ctrl-X
- **Time Tracking**: Track total time spent on task
- **Writing Tool Integration**: Works seamlessly with Quillbot and Grammarly for enhanced writing and editing
- **Statistics Display**: View statistics about your notes
- **Text Diff Tool**: Compare two versions of text with a built-in diff viewer
- **Keyboard Shortcuts**: Quick navigation between views (Ctrl+D)

## Installation

1. Clone the repository:
```bash
git clone [your-repository-url]
cd [repository-name]
```

2. Start a local Python server:
```bash
python -m http.server 8000
```

3. **For Full-Screen Experience (Recommended)**:
   - Open Microsoft Edge and navigate to `http://localhost:8000`
   - Click the three dots menu (⋮) in the top-right corner
   - Select "Apps" → "Install this site as an app"
   - Launch the app from your Start menu or desktop for a distraction-free, full-screen experience

## Usage

1. **Notes View**:
   - Filter notes by date
   - View total time tracked
   - Access project fail rate information
   - Use Quillbot or Grammarly browser extensions for enhanced writing assistance

2. **Diff View** (Ctrl+D):
   - Paste original and modified text
   - Compare differences between texts
   - Use writing tools to improve text before comparison

## Writing Tool Integration

Timer Notes is fully compatible with popular writing enhancement tools:
- **Quillbot**: Use for paraphrasing and grammar checking
- **Grammarly**: Get real-time writing suggestions and corrections
- Both tools work seamlessly in both Notes View and Diff View

## Dependencies

- [Tailwind CSS](https://tailwindcss.com/) - For styling
- Modern web browser with JavaScript enabled
- Microsoft Edge (recommended for app installation)
- Python (required for full screen)

## License

[Add your license information here] 