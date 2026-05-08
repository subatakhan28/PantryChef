"use client";

import { signInWithGoogle } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

export function GoogleButton({ next }: { next?: string }) {
  return (
    <form action={signInWithGoogle}>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <Button type="submit" variant="outline" className="w-full">
        <GoogleLogo className="size-4" />
        Continue with Google
      </Button>
    </form>
  );
}

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        d="M21.6 12.227c0-.818-.073-1.605-.21-2.36H12v4.46h5.39a4.61 4.61 0 0 1-2 3.025v2.514h3.235c1.895-1.745 2.985-4.32 2.985-7.64Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 4.965-.895 6.62-2.434l-3.235-2.514c-.895.6-2.04.96-3.385.96-2.605 0-4.81-1.76-5.6-4.124H3.066v2.59A9.997 9.997 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.4 13.888a5.99 5.99 0 0 1 0-3.776v-2.59H3.066a10.005 10.005 0 0 0 0 8.956L6.4 13.888Z"
        fill="#FBBC05"
      />
      <path
        d="M12 6c1.47 0 2.79.506 3.83 1.498l2.872-2.872C16.96 3.06 14.695 2 12 2A9.997 9.997 0 0 0 3.066 7.523L6.4 10.112C7.19 7.748 9.395 6 12 6Z"
        fill="#EA4335"
      />
    </svg>
  );
}
