"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Package, DollarSign, Hash, FileText, Archive, X } from "lucide-react";

interface GearItem {
  id: number;
  name: string;
  category: string;
  num_available: number;
  description: string | null;
  price_tu_th: number | null;
  price_th_tu: number | null;
  price_week: number | null;
  total_times_rented: number | null;
  revenue_generated: number | null;
}

interface GearEditModalProps {
  gear: GearItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (gear: GearItem) => void;
}

export default function GearEditModal({ gear, isOpen, onClose, onSave }: GearEditModalProps) {
  const [formData, setFormData] = useState<GearItem | null>(gear);

  // Update form data when gear prop changes
  React.useEffect(() => {
    setFormData(gear);
  }, [gear]);

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

  const handleInputChange = (field: keyof GearItem, value: string | number | null) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-medium flex items-center gap-2">
            <Package className="h-5 w-5" />
            Edit Gear Item
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
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-base md:text-lg font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="name">Item Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter gear name"
                  className="w-full"
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  placeholder="Enter category"
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter item description"
                rows={3}
              />
            </div>
          </div>

          {/* Inventory */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Archive className="h-4 w-4" />
              Inventory
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="num_available">Units Available</Label>
                <Input
                  id="num_available"
                  type="number"
                  min="0"
                  value={formData.num_available}
                  onChange={(e) => handleInputChange('num_available', e.target.value ? parseInt(e.target.value) : 0)}
                />
              </div>
              
              <div className="flex items-center gap-2 pt-6">
                <Badge 
                  variant={formData.num_available > 0 ? "default" : "secondary"}
                  className={formData.num_available > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                >
                  {formData.num_available > 0 ? 'In Stock' : 'Out of Stock'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Pricing
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price_tu_th">Tue-Thu Price</Label>
                <Input
                  id="price_tu_th"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price_tu_th || ''}
                  onChange={(e) => handleInputChange('price_tu_th', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <Label htmlFor="price_th_tu">Thu-Tue Price</Label>
                <Input
                  id="price_th_tu"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price_th_tu || ''}
                  onChange={(e) => handleInputChange('price_th_tu', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <Label htmlFor="price_week">Weekly Price</Label>
                <Input
                  id="price_week"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price_week || ''}
                  onChange={(e) => handleInputChange('price_week', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Statistics (Read-only) */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Statistics
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <Label className="text-sm text-gray-600">Total Times Rented</Label>
                <p className="text-2xl font-bold text-blue-600">
                  {formData.total_times_rented || 0}
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <Label className="text-sm text-gray-600">Revenue Generated</Label>
                <p className="text-2xl font-bold text-green-600">
                  ${(formData.revenue_generated || 0).toFixed(2)}
                </p>
              </div>
            </div>
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