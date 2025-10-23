//import {useState} from 'react';
import { PrismaClient } from '@prisma/client';
import Search from "lucide-react";
import React from 'react'; 

// SearchBar component
export function SearchBar() {
    // State to manage the search input
    /*const [search, setSearch] = useState('');

    //State to manage all the status filters
    const [selectedStatus, setSelectedStates] = useState('all');


    // Function to clear the search input
    const clearSearch = () => {
        setSearch('');
    }

    // Function to handle changes in the search input
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
    }*/

    return(

    <div className="flex items-center gap-4 mb-6">
        <div className="bg-gray-200 shadow rounded-md overflow-x-auto w-[1200px]">
            {/* Inner container with max width and padding */}
            <div className="px-6 py-2.5">
                {/* Div instead of form since we're not submitting anything */}
                <div className="bg-gray-200 rounded-md">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                        <input 
                            type="text"
                            placeholder="Search"
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
    )
}

