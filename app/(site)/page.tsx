import Link from 'next/link';
import { ArrowRight, Search, Users, Briefcase, LineChart } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Sección Hero */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Encuentra tu <span className="text-blue-400">Talento Tech</span> Ideal
          </h1>
          <p className="text-gray-300 text-xl md:text-2xl max-w-2xl mx-auto mb-12">
            Plataforma impulsada por IA para descubrir, evaluar y conectar con los mejores profesionales tecnológicos
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/Auth/signUp"
              className="inline-flex items-center px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Comenzar
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link 
              href="/about"
              className="inline-flex items-center px-6 py-3 rounded-lg border border-gray-600 text-gray-200 hover:bg-gray-800 transition-colors"
            >
              Saber Más
            </Link>
          </div>
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
            href="/signup"
            className="inline-flex items-center px-8 py-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-lg"
          >
            Comienza a Contratar
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
}) {
  return (
    <div className="p-6 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-blue-500/50 transition-colors">
      <div className="mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-300">
        {description}
      </p>
    </div>
  );
}
