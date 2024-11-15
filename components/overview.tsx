"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from "recharts"

const data = [
  {
    name: "Jan",
    selected: 65,
    notSelected: 35,
  },
  {
    name: "Feb",
    selected: 59,
    notSelected: 41,
  },
  {
    name: "Mar",
    selected: 80,
    notSelected: 20,
  },
  {
    name: "Apr",
    selected: 81,
    notSelected: 19,
  },
  {
    name: "May",
    selected: 56,
    notSelected: 44,
  },
  {
    name: "Jun",
    selected: 55,
    notSelected: 45,
  },
  {
    name: "Jul",
    selected: 40,
    notSelected: 60,
  },
]

export function Overview() {
  return (
    <Card className="bg-[#272727] border-[#242424]">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-[40px] font-bold text-white">Overview</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#2563eb]" />
              <span className="text-[#7C8DB5] text-[17px]">Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#dc2626]" />
              <span className="text-[#7C8DB5] text-[17px]">Not Selected</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart 
            data={data}
            barGap={10}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={true} 
              horizontal={true}
              stroke="#7C8DB5"
              opacity={0.2}
            />
            <XAxis
              dataKey="name"
              stroke="#7C8DB5"
              fontSize={17}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#7C8DB5"
              fontSize={17}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}%`}
            />
            <Bar
              dataKey="selected"
              fill="#2563eb"
              radius={[4, 4, 0, 0]}
              barSize={30}
            />
            <Bar
              dataKey="notSelected"
              fill="#dc2626"
              radius={[4, 4, 0, 0]}
              barSize={30}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}