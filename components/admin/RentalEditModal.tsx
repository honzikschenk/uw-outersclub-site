"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Calendar, 
  Package, 
  User,
  CheckCircle,
  Clock,
  AlertTriangle,
  X
} from "lucide-react";

interface EnhancedRental {
  id: number;
  lent_date: string;
  due_date: string | null;
  gear_id: number;
  user_id: string;
  returned: boolean;
  gearName: string;
  gearCategory: string;
  userName: string;
  status: 'returned' | 'overdue' | 'active';
}

interface RentalEditModalProps {
  rental: EnhancedRental | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (rental: EnhancedRental) => void;
}

export default function RentalEditModal({ rental, isOpen, onClose, onSave }: RentalEditModalProps) {
  const [formData, setFormData] = useState<EnhancedRental | null>(rental);

  // Update form data when rental prop changes
  React.useEffect(() => {
    setFormData(rental);
  }, [rental]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!formData || !isOpen) return null;

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const handleInputChange = (field: keyof EnhancedRental, value: string | boolean) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const getStatusInfo = (rental: EnhancedRental) => {
    if (rental.returned) {
      return { status: 'returned', color: 'green', icon: CheckCircle, label: 'Returned' };
    }
    if (rental.due_date && new Date(rental.due_date) < new Date()) {
      return { status: 'overdue', color: 'red', icon: AlertTriangle, label: 'Overdue' };
    }
    return { status: 'active', color: 'blue', icon: Clock, label: 'Active' };
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const statusInfo = getStatusInfo(formData);
  const StatusIcon = statusInfo.icon;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-medium flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Edit Rental
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Rental Status */}
          <div className="space-y-4">
            <h3 className="text-base md:text-lg font-medium flex items-center gap-2">
              <StatusIcon className={`h-4 w-4 text-${statusInfo.color}-600`} />
              Rental Status
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <Label className="text-sm text-gray-600">Current Status</Label>
                <Badge 
                  variant="outline" 
                  className={`mt-1 bg-${statusInfo.color}-100 text-${statusInfo.color}-800 border-${statusInfo.color}-300`}
                >
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusInfo.label}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="returned"
                  checked={formData.returned}
                  onCheckedChange={(checked) => handleInputChange('returned', checked)}
                />
                <Label htmlFor="returned">Mark as Returned</Label>
              </div>
            </div>
          </div>

          {/* Gear Information (Read-only) */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              Gear Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <Label className="text-sm text-gray-600">Gear Name</Label>
                <p className="text-lg font-semibold text-gray-900">{formData.gearName}</p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <Label className="text-sm text-gray-600">Category</Label>
                <p className="text-lg font-semibold text-gray-900 capitalize">{formData.gearCategory}</p>
              </div>
            </div>
          </div>

          {/* Renter Information (Read-only) */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Renter Information
            </h3>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <Label className="text-sm text-gray-600">Rented By</Label>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {formData.userName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-lg font-semibold text-gray-900">{formData.userName}</span>
              </div>
            </div>
          </div>

          {/* Rental Dates */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Rental Dates
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lent_date">Rental Date</Label>
                <Input
                  id="lent_date"
                  type="date"
                  value={formData.lent_date ? new Date(formData.lent_date).toISOString().slice(0, 10) : ""}
                  onChange={(e) => handleInputChange('lent_date', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date ? new Date(formData.due_date).toISOString().slice(0, 10) : ""}
                  onChange={(e) => handleInputChange('due_date', e.target.value)}
                />
              </div>
            </div>

            {/* Duration Info */}
            {formData.lent_date && formData.due_date && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <Label className="text-sm text-blue-700">Rental Duration</Label>
                <p className="text-blue-900 font-medium">
                  {Math.ceil((new Date(formData.due_date).getTime() - new Date(formData.lent_date).getTime()) / (1000 * 60 * 60 * 24))} days
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
