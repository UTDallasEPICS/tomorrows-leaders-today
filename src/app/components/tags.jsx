"use client";

import React from 'react';

const Tags = ({ tags, onRemove }) => { // tags component which takes tags and onRemove function as props
  return (
    <div className="tags-container">
      {tags.map((tag, index) => (
        <div key={index} className="tag">
          {tag}
          <button onClick={() => onRemove(tag)} className="remove-tag">×</button>
        </div>
      ))}
    </div>
    //here is where the tags are displayed and the remove button is added
  );
};
export default Tags;
