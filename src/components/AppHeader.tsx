import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const AppHeader = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Você saiu da conta.");
    navigate("/login");
  };

  return (
    <header className="border-b border-border bg-card px-4 py-3 sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-primary-foreground font-bold text-lg">G</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-3">
            <h1 className="text-lg sm:text-xl font-bold text-foreground">Quantitativo de Aço</h1>
            <span className="text-xs sm:text-sm text-muted-foreground font-medium">Grilo Engenharia</span>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
          <LogOut className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Sair</span>
        </Button>
      </div>
    </header>
  );
};

export default AppHeader;
