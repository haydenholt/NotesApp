# Timer Notes

A web-based note-taking application with time tracking, text comparison, and system prompt generation features.


## Features

- **Time Tracking**: Track total time spent on task. The time starts once an ID or text is entered into a note.
- **Off-Platform Time Tracking**: Track off-platform time (training, sheetwork, blocked time)
- **Pay Analysis**: Weekly earnings report
- **Feedback**: Auto-format feedback with Ctrl-X
- **Writing Tool Integration**: Works with Quillbot and Grammarly for checking grammar and spelling
- **Text Diff Tool**: Built-in diff viewer with multiple diff modes
- **Note Cancellation**: Press `F1` on any non-completed note mark the note as a canceled task and copy the cancellation message to the clipboard
- **System Prompt Generators**: Formats your inputs into LLM Prompt templates
- **Theme Support**: Light and dark mode
- **Automatic Backup**: Built-in backup server that automatically saves your data


## Installation

1. Clone the repository:
```bash
git clone [your-repository-url]
cd [repository-name]
```

2. Install dependencies:
```bash
npm install
```

3. Start the application with automatic backup:
```bash
npm start
```
This will start:
- Web application at `http://localhost:8000`
- Backup server at `http://localhost:8001` (for automatic data backup)

4. **For Full-Screen Experience (Recommended)**:
   - Open Microsoft Edge and navigate to `http://localhost:8000`
   - Click the three dots menu (⋮) in the top-right corner
   - Select "Apps" → "Install this site as an app"

## Usage

1. **Notes View**:
   - Filter notes by date
   - View total time tracked
   - Access project fail rate information
   - Use Quillbot or Grammarly browser extensions

2. **Off-Platform Time Tracking**:
   - Track time spent on different activities outside the platform:
     - Project training
     - Sheetwork
     - Blocked from working

3. **Diff View** (Ctrl+D):
   - Compare differences between texts

4. **Pay Analysis View** (Ctrl+Y):
   - Weekly earnings report with calendar selection
   - Summary statistics of throughput and time worked for the week

5. **System Prompt View** (Ctrl+P):
   - Formats inputs into structured LLM prompt templates
   - Press Ctrl+X to copy generated prompts
   - Three generators available:
     - **Code Setup**: Creates environment setup instructions from code
     - **Prompt/Response Evaluation**: Compares AI responses against original prompts
     - **Content Comparison**: Side-by-side comparison of two responses

## Keyboard Controls

### View Controls
- **Ctrl+D**: Switch to Diff view
- **Ctrl+P**: Switch to System Prompt view
- **Ctrl+Y**: Switch to Pay Analysis view

### Note Controls
- **Ctrl+Enter**: Finish current note and stop the timer
- **Ctrl+X**: Copy formatted feedback to clipboard (Notes view) or copy generated prompt (System Prompt view)
- **Ctrl+Shift+V**: Paste clipboard content as formatted bullet point `- [content]`
- **F1**: Cancel the current active note and copy cancellation message to clipboard

## Screenshot
![alt text](public/images/screenshot_2.png)