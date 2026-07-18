"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { ComponentProps } from "react";

export { AnimatePresence };

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const slideUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

export const slideInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const stagger = {
  animate: {
    transition: { staggerChildren: 0.05 },
  },
};

export function FadeIn(props: ComponentProps<typeof motion.div>) {
  return <motion.div {...fadeIn} {...props} />;
}

export function SlideUp(props: ComponentProps<typeof motion.div>) {
  return <motion.div {...slideUp} {...props} />;
}

export function StaggerContainer(props: ComponentProps<typeof motion.div>) {
  return <motion.div variants={stagger} initial="initial" animate="animate" {...props} />;
}

export function PageTransition(props: ComponentProps<typeof motion.div>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      {...props}
    />
  );
}

export function StaggerItem(props: ComponentProps<typeof motion.div>) {
  return (
    <motion.div
      variants={{
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      {...props}
    />
  );
}
