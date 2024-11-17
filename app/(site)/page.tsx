'use client';  // Add this at the top since we're using framer-motion

import Link from 'next/link';
import { ArrowRight, Search, Users, LineChart, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="p-8 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 hover:border-blue-500/50 transition-all shadow-lg"
    >
      <div className="mb-4 text-blue-400 transform transition-transform group-hover:scale-110">
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-white mb-3">
        {title}
      </h3>
      <p className="text-gray-300 leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
};

const FloatingParticle = ({ delay = 0, position = { x: 0, y: 0 } }) => (
  <motion.div
    className="absolute w-2 h-2 bg-blue-500/30 rounded-full"
    style={{
      top: `${position.y}%`,
      left: `${position.x}%`,
    }}
    animate={{
      y: [0, -100, 0],
      x: [0, 50, 0],
      opacity: [0, 1, 0],
      scale: [0, 1.5, 0],
    }}
    transition={{
      duration: 10,
      repeat: Infinity,
      delay: delay,
      ease: "easeInOut",
    }}
  />
);

const particlePositions = Array.from({ length: 20 }, (_, i) => ({
  x: (i * 5) % 100,
  y: Math.floor(i / 5) * 20 % 100,
}));

const orbPositions = [
  { x: 20, y: 30 },
  { x: 50, y: 60 },
  { x: 80, y: 40 },
];

const StatsSection = () => (
  <section className="py-20 px-4 bg-gradient-to-b from-gray-900 to-gray-800">
    <div className="container mx-auto">
      <div className="grid md:grid-cols-3 gap-8 text-center">
        {[
          { number: "500+", label: "Empresas Activas" },
          { number: "10,000+", label: "Talentos Verificados" },
          { number: "95%", label: "Tasa de Éxito" },
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2 }}
            className="p-6"
          >
            <div className="text-4xl font-bold text-blue-400 mb-2">{stat.number}</div>
            <div className="text-gray-300">{stat.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section - Updated */}
      <section className="relative py-32 px-4 overflow-hidden">
        {/* Base Background */}
        <div className="absolute inset-0 -z-10">
          {/* Dark gradient base */}
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800" />
          
          {/* Grid Pattern */}
          <div 
            className="absolute inset-0 opacity-[0.15]"
            style={{
              backgroundImage: `
                linear-gradient(to right, #304050 1px, transparent 1px),
                linear-gradient(to bottom, #304050 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          />

          {/* Animated gradient overlay */}
          <motion.div
            className="absolute inset-0 opacity-30"
            style={{
              background: 'linear-gradient(45deg, #0055ff, #0099ff, #00ccff)',
              backgroundSize: '400% 400%',
            }}
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
            }}
          />

          {/* Floating particles */}
          {particlePositions.map((position, i) => (
            <FloatingParticle 
              key={i} 
              delay={i * 0.5} 
              position={position}
            />
          ))}

          {/* Glowing orbs */}
          <div className="absolute inset-0">
            {orbPositions.map((position, i) => (
              <motion.div
                key={i}
                className="absolute w-96 h-96 rounded-full"
                style={{
                  background: `radial-gradient(circle, rgba(56,182,255,0.15) 0%, rgba(56,182,255,0) 70%)`,
                  top: `${position.y}%`,
                  left: `${position.x}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  delay: i * 2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>

          {/* Scanlines effect */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(0deg, rgba(255,255,255,0.03) 50%, transparent 50%)',
              backgroundSize: '4px 4px',
              mixBlendMode: 'overlay',
            }}
          />

          {/* Subtle blur overlay */}
          <div className="absolute inset-0 backdrop-blur-[80px]" />
        </div>

        <div className="container mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Encuentra tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Talento</span> Ideal
            </h1>
            <p className="text-gray-300 text-xl md:text-2xl max-w-3xl mx-auto mb-12 leading-relaxed">
              Plataforma impulsada por IA para descubrir, evaluar y conectar con los mejores profesionales
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <motion.div whileHover={{ scale: 1.05 }}>
                <Link 
                  href="/Auth/signIn"
                  className="inline-flex items-center px-8 py-4 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 transition-all text-lg font-semibold shadow-lg"
                >
                  Comienza a Contratar
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }}>
                <Link 
                  href="/about"
                  className="inline-flex items-center px-8 py-4 rounded-lg border-2 border-gray-600/50 text-gray-200 hover:bg-gray-800/50 hover:border-blue-500/50 hover:text-blue-400 transition-all text-lg font-semibold group"
                >
                  Saber Más
                  <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Sección de Características */}
      <section className="py-20 px-4 bg-gray-900">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            ¿Por Qué Elegir Nuestra Plataforma?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Search className="h-8 w-8 text-blue-400" />}
              title="Búsqueda con IA"
              description="Algoritmos avanzados para encontrar los candidatos perfectos según tus requisitos"
            />
            <FeatureCard 
              icon={<Users className="h-8 w-8 text-blue-400" />}
              title="Perfiles Verificados"
              description="Candidatos pre-evaluados con habilidades y experiencia validadas"
            />
            <FeatureCard 
              icon={<LineChart className="h-8 w-8 text-blue-400" />}
              title="Insights del Mercado"
              description="Datos en tiempo real sobre tendencias salariales y disponibilidad"
            />
          </div>
        </div>
      </section>

      {/* Sección CTA */}
      <section className="py-20 px-4 bg-gray-800">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            ¿Listo para Transformar tu Proceso de Contratación?
          </h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Únete a cientos de empresas que ya encuentran su talento tech ideal a través de nuestra plataforma.
          </p>
          <Link 
            href="/Auth/signIn"
            className="inline-flex items-center px-8 py-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-lg"
          >
            Comienza a Contratar
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Insert Stats Section */}
      <StatsSection />
    </main>
  );
}
