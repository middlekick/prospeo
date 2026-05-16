import { redirect } from "next/navigation";

// L'ancienne URL /landing redirige désormais vers la racine "/" (landing publique)
export default function LandingRedirect() {
  redirect("/");
}
