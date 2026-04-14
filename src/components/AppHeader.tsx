import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import griloLogo from "@/assets/grilo-logo.jpg";

const AppHeader = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserName(user.user_metadata?.display_name || user.email?.split("@")[0] || "");
      }
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Você saiu da conta.");
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-[#0f1b3d] px-4 py-3 sm:px-6 shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={griloLogo} alt="Grilo" className="w-9 h-9 rounded-lg object-cover" />
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-3">
            <h1 className="text-lg sm:text-xl font-bold text-white">Quantitativo de Aço</h1>
            <span className="text-xs sm:text-sm text-gray-300 font-medium">Grilo Engenharia</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {userName && (
            <span className="text-sm text-gray-300 hidden sm:inline">Olá, {userName}</span>
          )}
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-gray-300 hover:text-white hover:bg-white/10 sm:w-auto sm:px-3" title="Sair">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Sair</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
