"use client";
import { useState } from "react";

export default function Home() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const sidebarWidth = 300;
  const collapsedWidth = 60;
  const sidebarHeight = 500;

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="app-container">
      {/* Sidebar Container */}
      <div 
        className="sidebar"
        style={{ 
          width: isCollapsed ? `${collapsedWidth}px` : `${sidebarWidth}px`,
          height: `${sidebarHeight}px`,
        }}
      >
        {/* Collapse Indicator (Triangle) */}
        <div 
          className="collapse-indicator"
          onClick={toggleCollapse}
        >
          <div className={`triangle ${isCollapsed ? 'right' : 'left'}`} />
        </div>
        
        {/* Search Bar Content */}
        {!isCollapsed && (
          <div className="search-container">
            <h1 className="search-title">Search</h1>
            
            <div className="topic-fields">
              {[1, 2, 3].map((i) => (
                <div key={i} className="input-group">
                  <label>Topic {i}</label>
                  <input type="text" placeholder={`Enter topic ${i}`} />
                </div>
              ))}
            </div>
            
            <button className="search-button">
              Search
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="main-content">
        <h1>Main Content Area</h1>
        <p>Click the triangle to collapse/expand the sidebar.</p>
      </div>
    </div>
  );
}