"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, User, Shield, Mail } from "lucide-react";

interface Member {
  user_id: string;
  name: string | null;
  joined_on: string | null;
  valid: boolean;
  admin: boolean;
}

interface UserDetailModalProps {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function UserDetailModal({ member, isOpen, onClose }: UserDetailModalProps) {
  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            {member.name || "Unknown User"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Name</label>
                  <p className="text-lg">{member.name || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">User ID</label>
                  <p className="text-sm font-mono">{member.user_id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <div className="mt-1">
                    <Badge
                      variant={member.valid ? "default" : "secondary"}
                      className={
                        member.valid ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }
                    >
                      {member.valid ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Role</label>
                  <div className="mt-1">
                    {member.admin ? (
                      <Badge variant="destructive">
                        <Shield className="h-3 w-3 mr-1" />
                        Administrator
                      </Badge>
                    ) : (
                      <Badge variant="outline">Member</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Join Date</label>
                <p className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {member.joined_on
                    ? new Date(member.joined_on).toLocaleDateString()
                    : "Not available"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Rental History Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Rental History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Rental history data will be displayed here.</p>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">Edit Member</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
