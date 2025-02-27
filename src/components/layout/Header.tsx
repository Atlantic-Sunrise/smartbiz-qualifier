
import { Button } from "@/components/ui/button";

interface HeaderProps {
  profile: any;
  onLogout: () => void;
}

export function Header({ profile, onLogout }: HeaderProps) {
  return (
    <div className="flex justify-between items-center mb-8 backdrop-blur-sm bg-white/30 dark:bg-black/30 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
      {profile?.company_name ? (
        <div className="text-left">
          <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400">
            {profile.company_name}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{profile.industry}</p>
        </div>
      ) : (
        <div></div> // Empty div to maintain flex layout
      )}
      <Button variant="outline" onClick={onLogout} className="hover:bg-gray-100 dark:hover:bg-gray-800">
        Sign Out
      </Button>
    </div>
  );
}
