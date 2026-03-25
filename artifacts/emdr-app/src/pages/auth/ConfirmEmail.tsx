import { useEffect } from "react";
import { useLocation } from "wouter";

export default function ConfirmEmail() {
  const [_, setLocation] = useLocation();
  useEffect(() => {
    setLocation("/therapist/login");
  }, []);
  return null;
}
