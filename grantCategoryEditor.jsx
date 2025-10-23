"use client";

import { useState, useEffect } from "react";

// Mock data (replace with Prisma later)
const mockFocusAreas = [
  { id: 1, name: "STEM & Innovation", enabled: true },
  { id: 2, name: "Arts & Culture", enabled: false },
  { id: 3, name: "Community Service", enabled: true },
];

export default function GrantCategoryEditor() {
  const [focusAreas, setFocusAreas] = useState([]);
  const [editing, setEditing] = useState(false);
  const [newArea, setNewArea] = useState("");

  useEffect(() => {
    setFocusAreas(mockFocusAreas);
  }, []);

  const toggleArea = (id) => {
    setFocusAreas((prev) =>
      prev.map((area) =>
        area.id === id ? { ...area, enabled: !area.enabled } : area
      )
    );
    // TODO: Update in database
  };

  const addArea = () => {
    if (!newArea.trim()) return;
    setFocusAreas((prev) => [
      ...prev,
      { id: prev.length + 1, name: newArea.trim(), enabled: true },
    ]);
    setNewArea("");
    // TODO: Create in database
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Leadership Focus Areas
        </h2>
        <button
          className="text-gray-500 hover:text-gray-700"
          onClick={() => setEditing(!editing)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
            <path d="M2 2l7.586 7.586"></path>
          </svg>
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Manage the leadership areas that Tomorrow’s Leaders Today focuses on.
      </p>

      {!editing ? (
        // --- View Mode ---
        <div className="space-y-2">
          {focusAreas.map((area) => (
            <div
              key={area.id}
              className="flex justify-between items-center p-2 rounded-md bg-gray-50 border"
            >
              <span className="text-gray-800">{area.name}</span>
              <input
                type="checkbox"
                checked={area.enabled}
                onChange={() => toggleArea(area.id)}
                className="w-5 h-5 accent-blue-600"
              />
            </div>
          ))}
        </div>
      ) : (
        // --- Edit Mode ---
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setEditing(false);
          }
        }
        >
          <div className="space-y-2">
            {focusAreas.map((area) => (
              <div
                key={area.id}
                className="flex justify-between items-center p-2 rounded-md bg-gray-50 border"
              >
                <input
                  type="text"
                  value={area.name}
                  onChange={(e) =>
                    setFocusAreas((prev) =>
                      prev.map((a) =>
                        a.id === area.id
                          ? { ...a, name: e.target.value }
                          : a
                      )
                    )
                  }
                  className="flex-grow bg-transparent border-b-2 text-gray-800 focus:outline-none"
                />
                <input
                  type="checkbox"
                  checked={area.enabled}
                  onChange={() => toggleArea(area.id)}
                  className="w-5 h-5 accent-blue-600 ml-2"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            <input
              type="text"
              placeholder="Add new focus area"
              value={newArea}
              onChange={(e) => setNewArea(e.target.value)}
              className="flex-grow border-b-2 text-gray-800 focus:outline-none"
            />
            <button
              type="button"
              onClick={addArea}
              className="text-yellow-700 hover:text-yellow-800"
            >
              Add
            </button>
          </div>

          <div className="space-x-8 mt-4">
            <input
              type="submit"
              value="Save"
              className="hover:cursor-pointer text-yellow-700 hover:text-yellow-800"
            />
            <button
              type="button"
              className="hover:cursor-pointer text-gray-500 hover:text-gray-700"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
