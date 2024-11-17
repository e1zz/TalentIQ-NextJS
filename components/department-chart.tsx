"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Doughnut } from "react-chartjs-2"
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
)

const data = {
  labels: ['Fulfilled', 'Not Fulfilled'],
  datasets: [
    {
      data: [65, 35],
      backgroundColor: [
        '#2563eb',  // Blue
        '#dc2626',  // Red
      ],
      borderWidth: 0,
      hoverOffset: 4
    },
  ],
}

const options = {
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        padding: 20,
        font: {
          size: 12
        },
        usePointStyle: true,
        color: '#fff'
      }
    }
  },
  cutout: '60%',
  maintainAspectRatio: true,
}

export function DepartmentChart() {
  return (
    <Card className="bg-[#272727] border-0">
      <CardContent className="flex items-center justify-center p-6">
        <div className="relative w-full max-w-[300px] aspect-square mx-auto">
          <Doughnut 
            data={data} 
            options={{
              ...options,
              responsive: true,
              maintainAspectRatio: true
            }} 
          />
        </div>
      </CardContent>
    </Card>
  )
}