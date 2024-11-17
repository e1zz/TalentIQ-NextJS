'use client';

import { motion } from 'framer-motion';
import { Building, Users, Globe, Award, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface StatCardProps {
  icon: React.ReactNode;
  number: string;
  label: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, number, label }) => (
  <div className="p-6 rounded-lg bg-gray-800/50 border border-gray-700">
    <div className="flex items-center gap-4">
      <div className="p-3 rounded-lg bg-blue-500/10">
        {icon}
      </div>
      <div>
        <h3 className="text-2xl font-bold text-white">{number}</h3>
        <p className="text-gray-400">{label}</p>
      </div>
    </div>
  </div>
);

export default function About() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gray-900">
      {/* Back Button */}
      <div className="container mx-auto px-4 pt-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Volver</span>
        </button>
      </div>

      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Sobre <span className="text-blue-400">Nosotros</span>
            </h1>
            <p className="text-gray-300 text-xl max-w-2xl mx-auto">
              Transformando el futuro del reclutamiento tecnológico en Latinoamérica
              a través de la innovación y la inteligencia artificial.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-6">
            <StatCard 
              icon={<Building className="h-6 w-6 text-blue-400" />}
              number="500+"
              label="Empresas"
            />
            <StatCard 
              icon={<Users className="h-6 w-6 text-blue-400" />}
              number="10,000+"
              label="Profesionales"
            />
            <StatCard 
              icon={<Globe className="h-6 w-6 text-blue-400" />}
              number="15+"
              label="Países"
            />
            <StatCard 
              icon={<Award className="h-6 w-6 text-blue-400" />}
              number="95%"
              label="Clientes Satisfechos"
            />
          </div>
        </div>
      </section>
    </main>
  );
} 