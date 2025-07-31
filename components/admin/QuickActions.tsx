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
      name: '',
      category: '',
      num_available: 0,
      description: '',
      price_tu_th: null,
      price_th_tu: null,
      price_week: null,
      total_times_rented: 0,
      revenue_generated: 0
    };
    setSelectedGear(newGear);
    setIsGearModalOpen(true);
  };

  const handleAddNewUser = () => {
    // Create empty user template for new member
    const newUser = {
      user_id: '',
      name: '',
      joined_on: new Date().toISOString(),
      valid: true,
      admin: false
    };
    setSelectedUser(newUser);
    setIsUserModalOpen(true);
  };

  const handleSaveGear = (gear: any) => {
    console.log("Quick action - saving gear:", gear);
    // TODO: Implement API call
  };

  const handleSaveUser = (user: any) => {
    console.log("Quick action - saving user:", user);
    // TODO: Implement API call
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