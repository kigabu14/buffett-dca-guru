-- Create analysis_settings table for custom scoring weights
CREATE TABLE public.analysis_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    name text NOT NULL,
    weights jsonb NOT NULL,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.analysis_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own analysis settings"
    ON public.analysis_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own analysis settings"
    ON public.analysis_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analysis settings"
    ON public.analysis_settings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analysis settings"
    ON public.analysis_settings FOR DELETE
    USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_analysis_settings_updated_at
    BEFORE UPDATE ON public.analysis_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();