import { useSeoMeta } from "@unhead/react";
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useSeoMeta({
    title: "PRIVATUM — 404",
    description: "The page you are looking for could not be found.",
  });

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md px-4">
        <div className="w-16 h-16 mx-auto bg-secondary rounded-full flex items-center justify-center mb-6">
          <Shield className="size-8 text-muted-foreground" />
        </div>
        <h1 className="text-5xl font-serif font-bold text-foreground mb-4">404</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Diese Seite existiert nicht oder wurde entfernt.
        </p>
        <Button asChild>
          <Link to="/">
            <ArrowLeft className="size-4 mr-2" />
            Zurück zur Startseite
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
