
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useElevenLabsKey() {
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    const checkApiKey = async () => {
      try {
        // First try to get from localStorage
        const storedKey = localStorage.getItem('eleven_labs_key');
        if (storedKey) {
          console.log('Found API key in localStorage');
          setApiKey(storedKey);
          return;
        }

        // If not in localStorage, try to get from Supabase
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('No user found');
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('api_keys')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching API key:', error);
          return;
        }
        
        if (data?.api_keys?.eleven_labs_key) {
          console.log('Setting API key from Supabase');
          const newKey = data.api_keys.eleven_labs_key;
          localStorage.setItem('eleven_labs_key', newKey);
          setApiKey(newKey);
        } else {
          console.log('No API key found in profile');
        }
      } catch (error) {
        console.error('Error checking API key:', error);
      }
    };

    checkApiKey();
  }, []);

  return apiKey;
}
