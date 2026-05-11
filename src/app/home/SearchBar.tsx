"use client";

import { useState } from "react";

export function SearchBar({ onSearch = () => {} }: { onSearch?: (term: string) => void }) {
    const [value, setValue] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
        onSearch(e.target.value);
    };

    return (
        <div className="flex items-center gap-4 mb-6">
            <div className="bg-gray-200 shadow rounded-md overflow-x-auto w-[1200px]">
                <div className="px-6 py-2.5">
                    <div className="bg-gray-200 rounded-md">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.35-4.35" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search"
                                value={value}
                                onChange={handleChange}
                                className="px-4 font-normal bg-transparent outline-none border-none flex-1"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <button className="bg-gray-200 shadow rounded-md p-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
            </button>
        </div>
    );
}
