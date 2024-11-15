import { Search, Users, Briefcase, Star, Filter, ArrowUpRight } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="min-h-screen p-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="Active Candidates"
          value="1,234"
          trend="+12%"
          icon={<Users className="h-6 w-6 text-blue-400" />}
        />
        <StatCard 
          title="Open Positions"
          value="56"
          trend="+5%"
          icon={<Briefcase className="h-6 w-6 text-green-400" />}
        />
        <StatCard 
          title="Interviews Scheduled"
          value="28"
          trend="+18%"
          icon={<Star className="h-6 w-6 text-yellow-400" />}
        />
        <StatCard 
          title="Placements Made"
          value="142"
          trend="+8%"
          icon={<ArrowUpRight className="h-6 w-6 text-purple-400" />}
        />
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search candidates by skills, experience, or location..."
              className="w-full pl-10 pr-4 py-2 bg-[#272727] border border-[#242424] rounded-lg 
                       text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 
                       focus:ring-blue-500/50"
            />
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#272727] border border-[#242424] 
                        rounded-lg text-gray-200 hover:bg-[#2f2f2f] transition-colors">
          <Filter className="h-5 w-5" />
          Filters
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidate Pipeline */}
        <div className="lg:col-span-2">
          <div className="bg-[#272727] border border-[#242424] rounded-lg p-4">
            <h2 className="text-xl font-semibold text-white mb-4">Candidate Pipeline</h2>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((candidate) => (
                <CandidateCard key={candidate} />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Interviews */}
          <div className="bg-[#272727] border border-[#242424] rounded-lg p-4">
            <h2 className="text-xl font-semibold text-white mb-4">Upcoming Interviews</h2>
            <div className="space-y-3">
              {[1, 2, 3].map((interview) => (
                <InterviewCard key={interview} />
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-[#272727] border border-[#242424] rounded-lg p-4">
            <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <QuickActionButton text="Post New Position" />
              <QuickActionButton text="Schedule Interview" />
              <QuickActionButton text="Generate Report" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, trend, icon }: any) {
  return (
    <div className="bg-[#272727] border border-[#242424] rounded-lg p-4">
      <div className="flex justify-between items-start mb-2">
        <div>{icon}</div>
        <span className="text-green-400 text-sm">{trend}</span>
      </div>
      <h3 className="text-white text-sm mb-1">{title}</h3>
      <p className="text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function CandidateCard() {
  return (
    <div className="flex items-center justify-between p-4 bg-[#2f2f2f] rounded-lg hover:bg-[#323232] transition-colors">
      {/* Candidate card content */}
    </div>
  );
}

function InterviewCard() {
  return (
    <div className="p-3 bg-[#2f2f2f] rounded-lg">
      {/* Interview card content */}
    </div>
  );
}

function QuickActionButton({ text }: { text: string }) {
  return (
    <button className="w-full px-4 py-2 text-left text-gray-200 hover:bg-[#2f2f2f] rounded-md transition-colors">
      {text}
    </button>
  );
}
