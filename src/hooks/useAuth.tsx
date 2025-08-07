import React from 'react';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    console.log('Auth useEffect: Setting up auth state listener');
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, 'Session:', !!session, 'User:', !!session?.user);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN') {
          console.log('User signed in successfully');
          toast({
            title: "เข้าสู่ระบบสำเร็จ",
            description: "ยินดีต้อนรับสู่แอปลงทุน",
          });
        }
        
        if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          toast({
            title: "ออกจากระบบแล้ว",
            description: "ขอบคุณที่ใช้บริการ",
          });
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('Initial session check:', !!session, 'Error:', error);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  const signUp = async (email: string, password: string, displayName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName
        }
      }
    });

    if (error) {
      let errorMessage = "เกิดข้อผิดพลาดในการสมัครสมาชิก";
      
      if (error.message.includes('already_registered')) {
        errorMessage = "อีเมลนี้ถูกใช้งานแล้ว";
      } else if (error.message.includes('weak_password')) {
        errorMessage = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
      } else if (error.message.includes('invalid_email')) {
        errorMessage = "รูปแบบอีเมลไม่ถูกต้อง";
      }

      toast({
        variant: "destructive",
        title: "ไม่สามารถสมัครสมาชิกได้",
        description: errorMessage,
      });
    } else {
      toast({
        title: "สมัครสมาชิกสำเร็จ",
        description: "กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี",
      });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      let errorMessage = "เกิดข้อผิดพลาดในการเข้าสู่ระบบ";
      
      if (error.message.includes('invalid_credentials')) {
        errorMessage = "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
      } else if (error.message.includes('email_not_confirmed')) {
        errorMessage = "กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ";
      }

      toast({
        variant: "destructive",
        title: "ไม่สามารถเข้าสู่ระบบได้",
        description: errorMessage,
      });
    }

    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถออกจากระบบได้",
      });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      signIn,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};