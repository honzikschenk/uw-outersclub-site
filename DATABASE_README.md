# Database Integration Guide for UW Outers Club Admin Dashboard

This document outlines all the database tables, schemas, and integrations needed for the admin dashboard functionality.

## Overview
The admin dashboard provides comprehensive management tools for users, gear inventory, rentals, and analytics. This system uses Supabase as the backend database.

## Core Database Tables

### 1. Membership Table
**Purpose**: Manages user accounts and membership status
```sql
CREATE TABLE Membership (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT NOT NULL,
  joined_on DATE DEFAULT CURRENT_DATE,
  valid BOOLEAN DEFAULT false,
  admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Required Fields**:
- `user_id`: Links to Supabase auth.users table
- `name`: Full name of the member
- `joined_on`: Date when membership started
- `valid`: Whether membership is currently active
- `admin`: Whether user has admin privileges

### 2. Gear Table
**Purpose**: Manages equipment inventory
```sql
CREATE TABLE Gear (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Required Fields**:
- `name`: Name/model of the gear item
- `category`: Category for grouping (e.g., "camping", "climbing", "hiking")
- `description`: Optional detailed description
- `available`: Whether item is currently available for rent

### 3. Lent Table
**Purpose**: Tracks rental transactions
```sql
CREATE TABLE Lent (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES Membership(user_id),
  gear_id INTEGER REFERENCES Gear(id),
  lent_date DATE NOT NULL,
  due_date DATE NOT NULL,
  returned BOOLEAN DEFAULT false,
  return_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Required Fields**:
- `user_id`: Who rented the item
- `gear_id`: What item was rented
- `lent_date`: When the rental started
- `due_date`: When the item should be returned
- `returned`: Whether the item has been returned
- `return_date`: Actual return date (optional)

## Additional Tables for Enhanced Functionality

### 4. Events Table (Recommended)
**Purpose**: Manage club events and trips
```sql
CREATE TABLE Events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  max_participants INTEGER,
  created_by UUID REFERENCES Membership(user_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. Event_Registrations Table (Recommended)
**Purpose**: Track event attendance
```sql
CREATE TABLE Event_Registrations (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES Events(id),
  user_id UUID REFERENCES Membership(user_id),
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);
```

### 6. Gear_Maintenance Table (Optional)
**Purpose**: Track maintenance and repairs
```sql
CREATE TABLE Gear_Maintenance (
  id SERIAL PRIMARY KEY,
  gear_id INTEGER REFERENCES Gear(id),
  maintenance_type TEXT NOT NULL, -- 'repair', 'inspection', 'cleaning'
  description TEXT,
  cost DECIMAL(10,2),
  performed_by UUID REFERENCES Membership(user_id),
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Row Level Security (RLS) Policies

### Membership Table
```sql
-- Allow users to read their own data
CREATE POLICY "Users can read own membership" ON Membership
  FOR SELECT USING (auth.uid() = user_id);

-- Allow admins to read/update all memberships
CREATE POLICY "Admins can manage all memberships" ON Membership
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM Membership 
      WHERE user_id = auth.uid() AND admin = true
    )
  );
```

### Gear Table
```sql
-- Anyone can read gear (for browsing)
CREATE POLICY "Anyone can read gear" ON Gear
  FOR SELECT USING (true);

-- Only admins can modify gear
CREATE POLICY "Admins can manage gear" ON Gear
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM Membership 
      WHERE user_id = auth.uid() AND admin = true
    )
  );
```

### Lent Table
```sql
-- Users can read their own rentals
CREATE POLICY "Users can read own rentals" ON Lent
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can manage all rentals
CREATE POLICY "Admins can manage all rentals" ON Lent
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM Membership 
      WHERE user_id = auth.uid() AND admin = true
    )
  );
```

## Required API Endpoints

### Existing Endpoints
1. `/api/me` - Get current user info and admin status
2. `/api/admin-spreadsheet-save` - Save admin spreadsheet changes
3. `/api/user-names` - Get user names by IDs
4. `/api/gear-names` - Get gear names by IDs

### Recommended Additional Endpoints
1. `/api/admin/analytics` - Get dashboard analytics data
2. `/api/admin/export` - Export data for reporting
3. `/api/gear/categories` - Manage gear categories
4. `/api/events` - CRUD operations for events
5. `/api/maintenance` - Track gear maintenance

## Database Indexes for Performance

```sql
-- Performance indexes for common queries
CREATE INDEX idx_lent_user_id ON Lent(user_id);
CREATE INDEX idx_lent_gear_id ON Lent(gear_id);
CREATE INDEX idx_lent_due_date ON Lent(due_date);
CREATE INDEX idx_lent_returned ON Lent(returned);
CREATE INDEX idx_gear_category ON Gear(category);
CREATE INDEX idx_gear_available ON Gear(available);
CREATE INDEX idx_membership_admin ON Membership(admin);
CREATE INDEX idx_membership_valid ON Membership(valid);
```

## Environment Variables Required

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Data Migration Scripts

### Initial Admin User Setup
```sql
-- Create first admin user (replace with actual user ID)
INSERT INTO Membership (user_id, name, valid, admin, joined_on)
VALUES ('your-admin-user-uuid', 'Admin User', true, true, CURRENT_DATE)
ON CONFLICT (user_id) DO UPDATE SET admin = true;
```

### Sample Data for Testing
```sql
-- Sample gear items
INSERT INTO Gear (name, category, description, available) VALUES
('Coleman 4-Person Tent', 'camping', 'Dome tent suitable for 4 people', true),
('MSR WhisperLite Stove', 'camping', 'Lightweight backpacking stove', true),
('Black Diamond Climbing Harness', 'climbing', 'Adult climbing harness', true),
('Osprey 65L Backpack', 'hiking', 'Large capacity hiking backpack', false);

-- Sample lent items
INSERT INTO Lent (user_id, gear_id, lent_date, due_date, returned) VALUES
('user-uuid-1', 1, '2024-01-15', '2024-01-22', false),
('user-uuid-2', 3, '2024-01-10', '2024-01-17', true);
```

## Backup and Recovery

### Regular Backups
- Set up automated daily backups of all tables
- Export analytics data monthly for historical reporting
- Maintain audit logs for admin actions

### Data Retention Policies
- Keep rental history for at least 2 years
- Archive old membership data annually
- Maintain gear maintenance logs indefinitely

## Security Considerations

1. **Admin Access**: Only grant admin privileges to trusted members
2. **Data Privacy**: Ensure member data is protected according to privacy laws
3. **Audit Logging**: Track all admin actions for accountability
4. **Regular Reviews**: Periodically review admin permissions
5. **Secure Backups**: Encrypt backup data and store securely

## Integration Checklist

- [ ] Create all required database tables
- [ ] Set up Row Level Security policies
- [ ] Create performance indexes
- [ ] Configure environment variables
- [ ] Set up first admin user
- [ ] Test admin dashboard functionality
- [ ] Implement backup procedures
- [ ] Document admin procedures
- [ ] Train admin users on system

## Support and Maintenance

For questions about the database setup or admin dashboard functionality, contact the development team. Regular maintenance should include:

- Monthly review of analytics data
- Quarterly admin user audit
- Annual database performance review
- Ongoing monitoring of rental patterns and gear utilization

---

*Last updated: December 2024*
*Version: 1.0*