"use client"

import { useState } from "react";
import { useForm } from "react-hook-form";

type Fields = {
    primaryField: string
    secondaryFields: string
    grantMin: number
    grantMax: number
}

export default function GrantFields() {
    const [editing, setEditing] = useState(false);
    const [primary, setPrimary] = useState("Education Technology");
    const [secondary, setSecondary] = useState("Environmental Conservation, Public Health");
    const [size, setSize] = useState([50000, 100000]);
    const {
        register,
        handleSubmit,
        reset
    } = useForm<Fields>({
        defaultValues: {
            primaryField: primary,
            secondaryFields: secondary,
            grantMin: size[0],
            grantMax: size[1],
        }
    });

    const onSave = (input: Fields) => {
        setPrimary(input.primaryField);
        setSecondary(input.secondaryFields);
        setSize([input.grantMin, input.grantMax]);
        setEditing(false);
        reset(input);

        // TODO: Save to database
    }

    return (<div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Grant Fields</h2>
            <button className="text-gray-500 hover:text-gray-700" onClick={() => {
                setEditing(!editing);
                reset();
            }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
                    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
                    <path d="M2 2l7.586 7.586"></path>
                </svg>
            </button>
        </div>
        {!editing ?
            <div className="space-y-4">
                <div>
                    <p className="text-sm text-gray-500">Primary Field</p>
                    <p className="text-gray-800">{primary}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Secondary Fields</p>
                    <p className="text-gray-800">{secondary}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Grant Size Preference</p>
                    <p className="text-gray-800">{`\$${size[0].toLocaleString("en-US")}-\$${size[1].toLocaleString("en-US")}`}</p>
                </div>
            </div>
            :
            <form className="space-y-4" onSubmit={handleSubmit(onSave)}>
                <div>
                    <p className="text-sm text-gray-500">Primary Field</p>
                    <input className="text-gray-800 w-full border-b-2" {...register("primaryField", {
                        required: true,
                        maxLength: 30,
                    })} />
                </div>
                <div>
                    <p className="text-sm text-gray-500">Secondary Fields</p>
                    <input className="text-gray-800 w-full border-b-2" {...register("secondaryFields", {
                        required: true,
                        maxLength: 100
                    })} />
                </div>
                <div>
                    <p className="text-sm text-gray-500">Grant Size Preference</p>
                    <span className="text-gray-800">$</span>
                    <input className="text-gray-800 border-b-2" {...register("grantMin", {
                        required: true,
                        min: 0,
                    })} />
                    <span className="text-gray-800">-$</span>
                    <input className="text-gray-800 border-b-2" {...register("grantMax", {
                        required: true,
                    })} />
                </div>
                <div className="space-x-8">
                    <input className="hover:cursor-pointer text-gold-800 hover:text-gold-900" type="submit" value="Save" />
                    <button className="hover:cursor-pointer text-gray-500 hover:text-gray-700" onClick={() => {
                        setEditing(false);
                        reset();
                    }} >Cancel</button>
                </div>
            </form>
        }
    </div>);
}