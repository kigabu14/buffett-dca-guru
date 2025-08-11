-- Create user_watchlist table for storing user's custom stock watchlists
CREATE TABLE user_watchlist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  symbol text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create unique constraint to prevent duplicate symbols per user
ALTER TABLE user_watchlist ADD CONSTRAINT unique_user_symbol UNIQUE (user_id, symbol);

-- Create index for efficient queries
CREATE INDEX idx_user_watchlist_user_id ON user_watchlist(user_id);
CREATE INDEX idx_user_watchlist_order ON user_watchlist(user_id, order_index);

-- Enable RLS
ALTER TABLE user_watchlist ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own watchlist" ON user_watchlist
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own watchlist items" ON user_watchlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watchlist items" ON user_watchlist
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watchlist items" ON user_watchlist
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating updated_at
CREATE TRIGGER update_user_watchlist_updated_at
    BEFORE UPDATE ON user_watchlist
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();