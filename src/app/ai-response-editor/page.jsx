// ai-response-editor.jsx
"use client";

import { useState } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import "./ai-response-editor.css";

/* 
  SectionButton component represents a clickable section item with a circular progress bar.
  Props:
    - title: The main label of the section
    - subtitle: Optional subtext describing the section status
    - percentage: Progress percentage to display in the circular progress bar
*/
const SectionButton = ({ title, subtitle, percentage }) => (
  <div className="section-button">
    <div className="section-progress">
      <CircularProgressbar
        value={percentage}
        text={`${percentage}`}
        styles={buildStyles({
          textSize: "24px",
          pathColor: "#936fb1",
          textColor: "#333",
          trailColor: "#d6d6d6",
        })}
      />
    </div>

    <div className="section-text">
      <div className="section-label">{title}</div>
      {subtitle && <div className="section-subtext">{subtitle}</div>}
    </div>
  </div>
);

/* 
  AIResponseEditor is the main component rendering the AI response editor UI.
  It manages the response text state and handles user input and submission.
*/
export default function AIResponseEditor() {
  // State to hold the current AI response text
  const [response, setResponse] = useState("");

  // Handler for textarea input changes, updates the response state
  const handleChange = (e) => setResponse(e.target.value);

  // Handler for submit button click, currently logs the response to console
  const handleSubmit = () => console.log("Submitted response:", response);

  return (
    <div className="editor-wrapper">
      <div className="editor-flex">

        {/* LEFT: Editor column with heading outside the box */} 
        <div className="editor-column">
          {/* Heading for the editor section */} 
          <h1 className="editor-heading">Edit AI Response</h1>
          
          {/* Text editor section containing the textarea */} 
          <div className="editor-section">
            <textarea
              className="editor-textarea"
              value={response}
              onChange={handleChange}
              placeholder="Type your AI response here"
            />
          </div>

          {/* Submit button to trigger response submission */} 
          <button className="submit-button" onClick={handleSubmit}>
            SUBMIT
          </button>
        </div>

        {/* RIGHT: Sections column displaying progress on various sections */} 
        <div className="sections-column">
          {/* Heading for the sections panel */} 
          <h1 className="section-heading">Sections</h1>
          <div className="sections-panel">
            {/* Section buttons with progress indicators */} 
            <SectionButton percentage={80} title="Profile Completion" subtitle="Incomplete" />
            <SectionButton percentage={40} title="Contact Information" subtitle="Incomplete" />
            <SectionButton percentage={45} title="Essay Prompts" subtitle="Incomplete" />
            <SectionButton percentage={90} title="Grant Preferences" subtitle="Incomplete" />
          </div>
        </div>

      </div>
    </div>
  );
}
