"use client";


import Navbar from "../components/Navbar";
import { useState, useEffect, useRef } from "react";
import DataBox from "../components/DataBox";
import "./ai-response-editor.css";
import { toast } from "react-hot-toast";

export default function AIResponseEditor() {
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState([]);
  const textRef = useRef(null);

  useEffect(() => {
    const loadSections = async () => {
      try {
        const res = await fetch("/api/get-sections");
        if (!res.ok) throw new Error("API failed");
        const data = await res.json();
        setSections(data);
      } catch {
        setSections([
          { title: "Profile Completion", percentage: 0, subtitle: "Incomplete" },
          { title: "Contact Information", percentage: 0, subtitle: "Incomplete" },
          { title: "Essay Prompts", percentage: 0, subtitle: "Incomplete" },
          { title: "Grant Preferences", percentage: 0, subtitle: "Incomplete" },
        ]);
      }
    };

    loadSections();
    if (textRef.current) textRef.current.focus();
  }, []);

  const handleChange = (e) => setResponse(e.target.value);

  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === "Enter") {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!response.trim()) {
      toast.error("Response cannot be empty.");
      return;
    }

    setLoading(true);
    try {
      await new Promise((res) => setTimeout(res, 1500));
      toast.success("Response submitted successfully!");
      setResponse("");
    } catch (error) {
      toast.error("Failed to submit. Try again.");
      console.error("Submission error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setResponse("");
    textRef.current?.focus();
  };

  return (
    <>
      
  
      <div className="editor-wrapper">
      <Navbar />

        {loading && <div className="overlay-spinner">Submitting...</div>}
  
        <div className={`editor-flex ${loading ? "dimmed" : ""}`}>
          {/* Left column */}
          <div className="editor-column">
            <h1 className="editor-heading">Edit AI Response</h1>
  
            <div className="editor-section">
              <textarea
                ref={textRef}
                className="editor-textarea"
                value={response}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your AI response here"
                disabled={loading}
              />
            </div>
  
            <div className="editor-buttons">
              <button
                className="submit-button"
                onClick={handleSubmit}
                disabled={loading || !response.trim()}
              >
                {loading ? "Submitting..." : "SUBMIT"}
              </button>
  
              <button
                className="clear-button"
                onClick={handleClear}
                disabled={loading || !response}
              >
                CLEAR
              </button>
            </div>
          </div>
  
          {/* Right column */}
          <div className="sections-column">
            <h1 className="section-heading">Sections</h1>
            <div className="sections-panel">
              {sections.map((s) => (
                <DataBox
                  key={`${s.title}-${s.subtitle}`}
                  percentage={s.percentage}
                  title={s.title}
                  subtitle={s.subtitle}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
  
}
