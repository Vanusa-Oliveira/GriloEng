import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import SteelTable from "@/components/SteelTable";

const Index = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/login");
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <div className="animate-pulse text-gray-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
          <SteelTable />
        </div>
      </main>
      <footer className="sticky bottom-0 z-50 border-t border-gray-700 bg-[#0f1b3d] px-4 py-3 sm:px-6 shadow-inner">
        <p className="text-xs sm:text-sm text-white text-center font-medium">
          ⚠️ ATENÇÃO: Cálculo auxiliar. A conferência final dos dados é de responsabilidade do responsável técnico.
        </p>
      </footer>
    </div>
  );
};

export default Index;
