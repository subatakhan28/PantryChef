import Link from "next/link";
import { ChefHat } from "lucide-react";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="grid min-h-svh place-items-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2 text-sm font-semibold text-foreground"
        >
          <ChefHat className="size-5 text-primary" />
          <span>PantryChef</span>
        </Link>
        {children}
      </div>
    </div>
  );
}
