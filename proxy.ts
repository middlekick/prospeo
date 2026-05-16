import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes accessibles sans être connecté
const isPublicRoute = createRouteMatcher([
  "/",              // landing publique
  "/landing(.*)",   // ancienne URL — redirige vers /
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhook",   // Stripe webhook — pas de token d'auth
  "/api/contact",   // formulaire contact de la landing
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
