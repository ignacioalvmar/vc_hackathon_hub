import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Lock } from "lucide-react";

export default function UnauthorizedMessage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        Access Restricted
                    </CardTitle>
                    <CardDescription>
                        This area is restricted to administrators only.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert variant="destructive">
                        <Lock className="h-4 w-4" />
                        <AlertTitle>Unauthorized Access</AlertTitle>
                        <AlertDescription>
                            Only admin users can see this panel. If you believe this is an error, please contact your administrator.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        </div>
    );
}


