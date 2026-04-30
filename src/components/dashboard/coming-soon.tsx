"use client";

import { motion } from "framer-motion";
import { Construction } from "lucide-react";

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-12 text-center"
    >
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-orange-500/15 mb-4">
        <Construction className="w-7 h-7 text-orange-300" />
      </div>
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-white/50 max-w-md mx-auto">{description}</p>
      <p className="text-xs text-white/30 mt-6">En cours de construction — à venir dans la prochaine itération</p>
    </motion.div>
  );
}
