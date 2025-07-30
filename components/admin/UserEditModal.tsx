"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  User, 
  Shield, 
  Calendar, 
  CheckCircle, 
  XCircle,
  UserCheck,
  ShieldCheck
} from "lucide-react";

interface Member {
  user_id: string;
  name: string | null;
  joined_on: string | null;
  valid: boolean;
  admin: boolean;
}

interface UserEditModalProps {
  user: Member | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: Member) => void;
}

export default function UserEditModal({ user, isOpen, onClose, onSave }: UserEditModalProps) {
  const [formData, setFormData] = useState<Member | null>(user);

  // Update form data when user prop changes
  React.useEffect(() => {
    setFormData(user);
  }, [user]);

  if (!formData) return null;

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const handleInputChange = (field: keyof Member, value: string | boolean) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Edit User Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Identity */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              User Identity
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter user's display name"
                />
              </div>
              
              <div>
                <Label htmlFor="user_id">User ID</Label>
                <Input
                  id="user_id"
                  value={formData.user_id}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">User ID cannot be changed</p>
              </div>
            </div>

            {/* User Avatar */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">
                  {(formData.name || formData.user_id.substring(0, 2)).charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium">{formData.name || 'Unnamed User'}</p>
                <p className="text-sm text-gray-600">Member since {formatDate(formData.joined_on)}</p>
              </div>
            </div>
          </div>

          {/* Membership Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Membership Status
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <UserCheck className="h-5 w-5 text-green-600" />
                  <div>
                    <Label className="text-base">Active Membership</Label>
                    <p className="text-sm text-gray-600">User can access club services and rent gear</p>
                  </div>
                </div>
                <Switch
                  checked={formData.valid}
                  onCheckedChange={(checked) => handleInputChange('valid', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-purple-600" />
                  <div>
                    <Label className="text-base">Administrator Privileges</Label>
                    <p className="text-sm text-gray-600">User can access admin dashboard and manage other users</p>
                  </div>
                </div>
                <Switch
                  checked={formData.admin}
                  onCheckedChange={(checked) => handleInputChange('admin', checked)}
                />
              </div>
            </div>
          </div>

          {/* Current Status Summary */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Current Status
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Label className="text-sm text-gray-600">Membership Status</Label>
                </div>
                <Badge 
                  variant={formData.valid ? "default" : "secondary"}
                  className={formData.valid ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                >
                  <div className="flex items-center gap-1">
                    {formData.valid ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    {formData.valid ? "Active" : "Inactive"}
                  </div>
                </Badge>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Label className="text-sm text-gray-600">Role</Label>
                </div>
                <Badge 
                  variant={formData.admin ? "destructive" : "outline"}
                >
                  <div className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    {formData.admin ? "Administrator" : "Member"}
                  </div>
                </Badge>
              </div>
            </div>
          </div>

          {/* Join Date Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Membership Information
            </h3>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <Label className="text-base text-blue-900">Joined On</Label>
                  <p className="text-sm text-blue-700">{formatDate(formData.joined_on)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}