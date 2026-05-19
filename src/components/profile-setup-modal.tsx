import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { MapPin, User, Hash, Trophy } from "lucide-react";

export function ProfileSetupModal() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [place, setPlace] = useState("");
  const [selectedSports, setSelectedSports] = useState<string[]>([]);

  const sportsList = ["Football", "Cricket", "Badminton", "Basketball", "Tennis", "Squash"];

  useEffect(() => {
    if (!user) {
      setIsOpen(false);
      return;
    }

    const checkProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("name, age, place, interested_sports")
          .eq("id", user.id)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            // Profile doesn't exist yet, force setup
            setName(user.user_metadata?.name || user.user_metadata?.full_name || "");
            setIsOpen(true);
            return;
          }
          console.error("Error fetching profile:", error);
          return;
        }

        if (data) {
          // Identify if signed in using Google
          const isGoogle = user.app_metadata?.provider === "google" || 
                           user.identities?.some(id => id.provider === "google");

          // Open modal if they are a Google user and any of the required details are missing
          const needsSetup = !data.place || !data.age || !data.interested_sports || data.interested_sports.length === 0;
          
          if (isGoogle && needsSetup) {
            setName(data.name || user.user_metadata?.name || user.user_metadata?.full_name || "");
            if (data.age) setAge(data.age.toString());
            if (data.place) setPlace(data.place);
            if (data.interested_sports) setSelectedSports(data.interested_sports);
            setIsOpen(true);
          }
        }
      } catch (err) {
        console.error("Failed to check profile setup status:", err);
      }
    };

    checkProfile();
  }, [user]);

  const handleSportToggle = (sport: string) => {
    setSelectedSports(prev => 
      prev.includes(sport) ? prev.filter(s => s !== sport) : [...prev, sport]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!age || isNaN(Number(age)) || Number(age) <= 0) {
      toast.error("Please enter a valid age");
      return;
    }
    if (!place) {
      toast.error("Please select a place");
      return;
    }
    if (selectedSports.length === 0) {
      toast.error("Please select at least one sport of interest");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user!.id,
          name: name.trim(),
          age: parseInt(age),
          place: place,
          interested_sports: selectedSports
        });

      if (error) throw error;

      toast.success("Profile setup complete! Welcome to ZenTurf.");
      setIsOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="sm:max-w-md [&>button]:hidden border-none shadow-[var(--shadow-elegant)] bg-card overflow-hidden"
      >
        <div className="absolute inset-0 -z-10 bg-[image:var(--gradient-hero)] opacity-5" />
        
        <DialogHeader className="space-y-2 text-center sm:text-center">
          <DialogTitle className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
            Welcome to ZenTurf!
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Please complete your profile details to get started booking the best sports venues in your city.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-3">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="setup-name" className="text-sm font-medium">Your Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="setup-name"
                placeholder="Enter your name"
                required
                className="pl-10 h-10"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          {/* Age Field */}
          <div className="space-y-2">
            <Label htmlFor="setup-age" className="text-sm font-medium">Age</Label>
            <div className="relative">
              <Hash className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="setup-age"
                type="number"
                placeholder="E.g. 24"
                required
                min={1}
                max={120}
                className="pl-10 h-10"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>
          </div>

          {/* Place Selection */}
          <div className="space-y-2">
            <Label htmlFor="setup-place" className="text-sm font-medium">Select City</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10" />
              <Select value={place} onValueChange={setPlace}>
                <SelectTrigger id="setup-place" className="pl-10 h-10 w-full bg-background border border-input shadow-sm">
                  <SelectValue placeholder="Choose your city" />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md">
                  <SelectItem value="Chennai">Chennai</SelectItem>
                  <SelectItem value="Bangalore">Bangalore</SelectItem>
                  <SelectItem value="Hyderabad">Hyderabad</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sports of Interest */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-muted-foreground" />
              Sports of Interest
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {sportsList.map(sport => {
                const isSelected = selectedSports.includes(sport);
                return (
                  <button
                    key={sport}
                    type="button"
                    onClick={() => handleSportToggle(sport)}
                    className={`h-10 px-3 text-xs font-medium rounded-lg border transition-all duration-250 cursor-pointer ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-sm scale-95"
                        : "bg-background text-muted-foreground border-input hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    {sport}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 text-sm font-semibold tracking-wide bg-[image:var(--gradient-hero)] hover:opacity-90 transition-opacity"
          >
            {loading ? "Saving Profile..." : "Save Profile & Continue"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
