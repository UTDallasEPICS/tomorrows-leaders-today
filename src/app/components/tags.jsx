"use client";

import React from "react";

const Tags = ({ tags, onRemove }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag, index) => (
        <div
          key={index}
          className="flex items-center bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm"
        >
          {tag}
          <button
            onClick={() => onRemove(tag)}
            className="ml-2 text-purple-500 hover:text-purple-700 font-bold"
            aria-label={`Remove ${tag}`}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default Tags;
