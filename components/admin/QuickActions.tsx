"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Users, Package } from "lucide-react";
import GearEditModal from "./GearEditModal";
import UserEditModal from "./UserEditModal";

interface QuickActionsProps {
  gearItems?: any[];
  users?: any[];
}

export default function QuickActions({ gearItems = [], users = [] }: QuickActionsProps) {
  const [isGearModalOpen, setIsGearModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedGear, setSelectedGear] = useState<{
    id: number;
    name: string;
    category: string;
    num_available: number;
    description: string;
    price_tu_th: number | null;
    price_th_tu: number | null;
    price_week: number | null;
    total_times_rented: number;
    revenue_generated: number;
  } | null>(null);
  const [selectedUser, setSelectedUser] = useState<{
    user_id: string;
    name: string;
    joined_on: string;
    valid: boolean;
    admin: boolean;
  } | null>(null);

  const handleAddNewGear = () => {
    // Create empty gear template for new item
    const newGear = {
      id: Date.now(), // Temporary ID
      name: "",
      category: "",
      num_available: 0,
      description: "",
      price_tu_th: null,
      price_th_tu: null,
      price_week: null,
      total_times_rented: 0,
      revenue_generated: 0,
    };
    setSelectedGear(newGear);
    setIsGearModalOpen(true);
  };

  const handleAddNewUser = () => {
    // Create empty user template for new member
    const newUser = {
      user_id: "",
      name: "",
      joined_on: new Date().toISOString(),
      valid: true,
      admin: false,
    };
    setSelectedUser(newUser);
    setIsUserModalOpen(true);
  };

  const handleSaveGear = async (gear: any) => {
    try {
      const response = await fetch("/api/admin/gear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gear),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Gear saved successfully:", result);
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        const error = await response.json();
        console.error("Error saving gear:", error.error);
        alert(`Error saving gear: ${error.error}`);
      }
    } catch (error) {
      console.error("Error saving gear:", error);
      alert("Error saving gear. Please try again.");
    }
  };

  const handleSaveUser = async (user: any) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("User saved successfully:", result);
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        const error = await response.json();
        console.error("Error saving user:", error.error);
        alert(`Error saving user: ${error.error}`);
      }
    } catch (error) {
      console.error("Error saving user:", error);
      alert("Error saving user. Please try again.");
    }
  };

  return (
    <>
      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
        <Button
          onClick={handleAddNewGear}
          className="rounded-full w-14 h-14 shadow-lg bg-blue-600 hover:bg-blue-700"
          title="Add New Gear"
        >
          <Package className="h-6 w-6" />
        </Button>

        <Button
          onClick={handleAddNewUser}
          className="rounded-full w-14 h-14 shadow-lg bg-green-600 hover:bg-green-700"
          title="Add New User"
        >
          <Users className="h-6 w-6" />
        </Button>
      </div>

      {/* Modals */}
      <GearEditModal
        gear={selectedGear}
        isOpen={isGearModalOpen}
        onClose={() => {
          setIsGearModalOpen(false);
          setSelectedGear(null);
        }}
        onSave={handleSaveGear}
      />

      <UserEditModal
        user={selectedUser}
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setSelectedUser(null);
        }}
        onSave={handleSaveUser}
      />
    </>
  );
}
