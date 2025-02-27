
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { UserCircle } from "lucide-react";

interface HeaderProps {
  profile: any;
  onLogout: () => void;
}

export function Header({ profile, onLogout }: HeaderProps) {
  const navigate = useNavigate();
  
  return (
    <header className="w-full border-b">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">
            {profile?.company_name || "Welcome"}
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => navigate('/business-profile')}
          >
            <UserCircle className="h-4 w-4" />
            Business Profile
          </Button>
          <Button
            variant="outline"
            onClick={onLogout}
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
