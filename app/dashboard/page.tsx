import { Search, Users, Briefcase, Star, Filter, ArrowUpRight } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="min-h-screen p-4 sm:p-6 landscape:p-4">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 landscape:grid-cols-4 sm:grid-cols-2 md:grid-cols-4 
                    gap-3 sm:gap-4 mb-4 sm:mb-6 landscape:mb-4">
        <StatCard 
          title="Active Candidates"
          value="1,234"
          trend="+12%"
          icon={<Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />}
        />
        <StatCard 
          title="Open Positions"
          value="56"
          trend="+5%"
          icon={<Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />}
        />
        <StatCard 
          title="Interviews Scheduled"
          value="28"
          trend="+18%"
          icon={<Star className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400" />}
        />
        <StatCard 
          title="Placements Made"
          value="142"
          trend="+8%"
          icon={<ArrowUpRight className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />}
        />
      </div>

      {/* Search and Filters */}
      <div className="mb-4 sm:mb-6 landscape:mb-4 flex flex-col landscape:flex-row sm:flex-row gap-3 sm:gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search candidates..."
              className="w-full pl-10 pr-4 py-2 bg-[#272727] border border-[#242424] rounded-lg 
                       text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 
                       focus:ring-blue-500/50"
            />
          </div>
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-[#272727] 
                        border border-[#242424] rounded-lg text-gray-200 
                        hover:bg-[#2f2f2f] transition-colors">
          <Filter className="h-5 w-5" />
          Filters
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 landscape:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Candidate Pipeline */}
        <div className="lg:col-span-2 landscape:col-span-2 order-2 landscape:order-1 lg:order-1">
          <div className="bg-[#272727] border border-[#242424] rounded-lg p-3 sm:p-4 landscape:p-3">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 landscape:mb-2 sm:mb-4">
              Candidate Pipeline
            </h2>
            <div className="space-y-3 landscape:space-y-2 sm:space-y-4">
              {[1, 2, 3, 4].map((candidate) => (
                <CandidateCard key={candidate} />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 landscape:space-y-3 sm:space-y-6 order-1 landscape:order-2 lg:order-2">
          {/* Upcoming Interviews */}
          <div className="bg-[#272727] border border-[#242424] rounded-lg p-3 landscape:p-2 sm:p-4">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 landscape:mb-2 sm:mb-4">
              Upcoming Interviews
            </h2>
            <div className="space-y-2 landscape:space-y-1.5 sm:space-y-3">
              {[1, 2, 3].map((interview) => (
                <InterviewCard key={interview} />
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-[#272727] border border-[#242424] rounded-lg p-3 landscape:p-2 sm:p-4">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 landscape:mb-2 sm:mb-4">
              Quick Actions
            </h2>
            <div className="space-y-2 landscape:space-y-1">
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
    <div className="bg-[#272727] border border-[#242424] rounded-lg p-3 sm:p-4">
      <div className="flex justify-between items-start mb-2">
        <div>{icon}</div>
        <span className="text-green-400 text-xs sm:text-sm">{trend}</span>
      </div>
      <h3 className="text-white text-xs sm:text-sm mb-1">{title}</h3>
      <p className="text-xl sm:text-2xl font-semibold text-white">{value}</p>
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
