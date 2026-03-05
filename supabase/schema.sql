-- Medication Management App Schema
-- Tables: medications, dose_logs, caregiver

-- Create medications table
CREATE TABLE IF NOT EXISTS public.medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dose_logs table
CREATE TABLE IF NOT EXISTS public.dose_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id uuid NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_date TIMESTAMP WITH TIME ZONE NOT NULL,
  taken boolean DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create caregiver table
CREATE TABLE IF NOT EXISTS public.caregiver (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  caregiver_name TEXT NOT NULL,
  caregiver_email TEXT,
  caregiver_phone TEXT,
  relationship TEXT,
  permissions TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dose_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregiver ENABLE ROW LEVEL SECURITY;

-- Create policies for medications
CREATE POLICY "Users can view their own medications" ON public.medications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own medications" ON public.medications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medications" ON public.medications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medications" ON public.medications
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for dose_logs
CREATE POLICY "Users can view their own dose logs" ON public.dose_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dose logs" ON public.dose_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dose logs" ON public.dose_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dose logs" ON public.dose_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for caregiver
CREATE POLICY "Users can view their own caregiver info" ON public.caregiver
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert caregiver info" ON public.caregiver
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update caregiver info" ON public.caregiver
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete caregiver info" ON public.caregiver
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_medications_user_id ON public.medications(user_id);
CREATE INDEX IF NOT EXISTS idx_dose_logs_user_id ON public.dose_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_dose_logs_medication_id ON public.dose_logs(medication_id);
CREATE INDEX IF NOT EXISTS idx_caregiver_user_id ON public.caregiver(user_id);
