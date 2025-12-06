// src/pages/FarmerProfile.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface FarmerProfile {
  _id?: string;
  farmName: string;
  location: string;
  bio: string;
  certifications?: Array<{
    name: string;
    issuer: string;
    validFrom?: string;
    validTo?: string;
    certificateId?: string;
  }>;
}

const FarmerProfile = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [farmName, setFarmName] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  
  // Fetch existing farmer profile
  const { data: profileData, isLoading } = useQuery({
    queryKey: ["farmer-profile"],
    queryFn: async () => {
      try {
        const response = await apiFetch<{ success: boolean; data: FarmerProfile }>("/farmers/profile");
        return response.data;
      } catch (error) {
        // If profile doesn't exist, that's okay
        return null;
      }
    },
  });
  
  // Set form values when profile data is loaded
  useEffect(() => {
    if (profileData) {
      setFarmName(profileData.farmName || "");
      setLocation(profileData.location || "");
      setBio(profileData.bio || "");
    }
  }, [profileData]);
  
  // Mutation to save profile
  const saveProfileMutation = useMutation({
    mutationFn: async (profileData: Partial<FarmerProfile>) => {
      return apiFetch<{ success: boolean; message: string }>("/farmers/profile", {
        method: "POST",
        body: JSON.stringify(profileData),
      });
    },
    onSuccess: () => {
      toast.success("Profile saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["farmer-profile"] });
      navigate("/farmer-portal");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to save profile");
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveProfileMutation.mutate({ farmName, location, bio });
  };
  
  if (isLoading) {
    return <div className="container py-8">Loading profile...</div>;
  }
  
  return (
    <div className="container py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Farmer Profile</CardTitle>
          <p className="text-muted-foreground">
            Complete your farmer profile to start selling your products
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Farm Name *</label>
              <Input
                placeholder="e.g. Green Valley Organics"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Location *</label>
              <Input
                placeholder="e.g. Bangalore, Karnataka"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Farm Bio</label>
              <Textarea
                placeholder="Tell us about your farm, farming practices, and what makes your products special..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
              />
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/farmer-portal")}
              >
                Skip for now
              </Button>
              <Button
                type="submit"
                disabled={saveProfileMutation.isPending}
              >
                {saveProfileMutation.isPending ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default FarmerProfile;