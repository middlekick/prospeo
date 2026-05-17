"use client";

/**
 * components/ui/AnimatedText.tsx
 * Révèle le texte en splittant par mots ou caractères, avec stagger.
 * Usage : <AnimatedText>Mon titre de hero</AnimatedText>
 */

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { easings } from "@/lib/design-tokens";

interface AnimatedTextProps {
  children:   string;
  as?:        "h1" | "h2" | "h3" | "h4" | "p" | "span";
  split?:     "words" | "chars";
  delay?:     number;   // délai avant le 1er enfant (secondes)
  stagger?:   number;   // délai entre chaque enfant
  className?: string;
  once?:      boolean;  // animer une seule fois au lieu de réapparaître
}

export default function AnimatedText({
  children,
  as       = "h2",
  split    = "words",
  delay    = 0,
  stagger  = 0.06,
  className = "",
  once     = true,
}: AnimatedTextProps) {
  const ref    = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once, margin: "0px 0px -60px 0px" });

  const parts = split === "chars"
    ? children.split("")
    : children.split(" ");

  const containerVariants = {
    hidden:  {},
    visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
  };

  const itemVariants = {
    hidden:  { y: "110%", opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.65, ease: easings.easeOutExpo },
    },
  };

  const Tag = motion[as as keyof typeof motion] as typeof motion.h2;

  return (
    <Tag
      ref={ref as React.Ref<HTMLHeadingElement>}
      className={`overflow-hidden ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
    >
      {parts.map((part, i) => (
        <motion.span
          key={i}
          variants={itemVariants}
          className="inline-block"
          style={{ marginRight: split === "words" ? "0.28em" : 0 }}
        >
          {part === " " ? " " : part}
        </motion.span>
      ))}
    </Tag>
  );
}
