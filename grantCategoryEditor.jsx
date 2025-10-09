// /components/GrantCategoryEditor.jsx
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

// Mock data (instead of Prisma for now)
const mockGrantCategories = [
  { id: 1, name: "STEM Grants", enabled: true },
  { id: 2, name: "Arts & Culture", enabled: false },
  { id: 3, name: "Community Development", enabled: true },
];

export default function GrantCategoryEditor() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");

  // Simulate fetching categories
  useEffect(() => {
    setCategories(mockGrantCategories);
  }, []);

  const toggleCategory = (id) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === id ? { ...cat, enabled: !cat.enabled } : cat
      )
    );
    // Later: prisma.grantCategory.update()
  };

  const addCategory = () => {
    if (!newCategory.trim()) return;
    setCategories((prev) => [
      ...prev,
      { id: prev.length + 1, name: newCategory, enabled: true },
    ]);
    setNewCategory("");
    // Later: prisma.grantCategory.create()
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-md rounded-2xl">
      <CardContent className="p-4 space-y-4">
        <h2 className="text-xl font-bold">Grant Category Preferences</h2>
        <div className="space-y-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex justify-between items-center p-2 rounded-lg bg-gray-50"
            >
              <span>{cat.name}</span>
              <Switch
                checked={cat.enabled}
                onCheckedChange={() => toggleCategory(cat.id)}
              />
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-4">
          <Input
            placeholder="New grant category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <Button onClick={addCategory}>Add</Button>
        </div>
      </CardContent>
    </Card>
  );
}
