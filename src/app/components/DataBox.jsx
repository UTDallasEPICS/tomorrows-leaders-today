"use client";

import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

export default function DataBox({ title, subtitle, percentage }) {
  return (
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
}