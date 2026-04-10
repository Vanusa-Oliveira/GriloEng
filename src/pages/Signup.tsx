import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import constructionBg from "@/assets/construction-bg.jpg";
import griloLogo from "@/assets/grilo-logo.jpg";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name },
      },
    });

    if (error) {
      if (error.message.includes("already registered")) {
        toast.error("Este e-mail já está cadastrado.");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Cadastro realizado com sucesso! Faça login para continuar.");
      await supabase.auth.signOut();
      navigate("/login");
    }

    setLoading(false);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 overflow-hidden">
      <img
        src={constructionBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        width={1920}
        height={1080}
      />
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="flex flex-col items-center mb-6">
          <img
            src={griloLogo}
            alt="Grilo Engenharia"
            className="w-20 h-20 rounded-xl object-cover mb-3"
          />
          <span className="text-xl font-bold text-[#1e3a5f]">Grilo Engenharia</span>
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-900 mb-1">Criar Conta</h1>
        <p className="text-sm text-center text-gray-500 mb-6">Preencha os dados para se cadastrar</p>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-700">Nome</Label>
            <Input
              id="name"
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-gray-50 border-gray-300"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-gray-50 border-gray-300"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-gray-50 border-gray-300"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-[#1e3a5f] hover:bg-[#15304f] text-white font-semibold"
            disabled={loading}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            {loading ? "Cadastrando..." : "Cadastrar"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500">
          Já tem uma conta?{" "}
          <Link to="/login" className="text-[#1e3a5f] font-medium hover:underline">
            Faça login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
