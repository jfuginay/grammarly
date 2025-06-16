import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function Dashboard() {
  const { signOut } = useAuth();

  return (
    <div className="flex min-h-screen bg-background">
      <main className="flex-1 p-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">You are logged in.</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Modify this page using prompts.
            </p>
            <Button
              onClick={() => {
                signOut();
              }}
              variant="destructive"
            >
              Log Out
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}