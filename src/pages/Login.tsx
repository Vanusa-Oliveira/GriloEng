import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { LogIn } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("E-mail ou senha incorretos.");
      } else if (error.message.includes("Email not confirmed")) {
        toast.error("E-mail não confirmado.");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Login realizado com sucesso!");
      navigate("/");
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-border shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">G</span>
            </div>
            <span className="text-lg font-semibold text-foreground">Grilo Engenharia</span>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Entrar</CardTitle>
          <p className="text-sm text-muted-foreground">Acesse sua conta para continuar</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              <LogIn className="mr-2 h-4 w-4" />
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Não tem uma conta?{" "}
            <Link to="/signup" className="text-primary font-medium hover:underline">
              Cadastre-se
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
