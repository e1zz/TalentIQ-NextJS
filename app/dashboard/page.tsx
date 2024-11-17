import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Overview } from "@/components/overview"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { DepartmentChart } from "@/components/department-chart"

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
        </div>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics" disabled className="relative">
            Analytics
            <span className="absolute -top-3 -right-3 bg-muted text-muted-foreground rounded-md px-1.5 py-0.5 text-xs">Soon</span>
          </TabsTrigger>
          <TabsTrigger value="reports" disabled className="relative">
            Reports
            <span className="absolute -top-3 -right-3 bg-muted text-muted-foreground rounded-md px-1.5 py-0.5 text-xs">Soon</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg md:text-xl font-bold">
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-base md:text-lg font-bold">$45,231.89</div>
                <p className="text-xs md:text-sm text-muted-foreground text-center">
                  +20.1% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg md:text-xl font-bold">
                  Active Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-base md:text-lg font-bold">+2350</div>
                <p className="text-xs md:text-sm text-muted-foreground text-center">
                  +180.1% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg md:text-xl font-bold">
                  Sales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-base md:text-lg font-bold">+12,234</div>
                <p className="text-xs md:text-sm text-muted-foreground text-center">
                  +19% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg md:text-xl font-bold">
                  Active Now
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-base md:text-lg font-bold">+573</div>
                <p className="text-xs md:text-sm text-muted-foreground text-center">
                  +201 since last hour
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle className="text-xl md:text-[40px] font-bold">Overview</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <Overview />
              </CardContent>
            </Card>
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl font-bold">Department Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <DepartmentChart />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
