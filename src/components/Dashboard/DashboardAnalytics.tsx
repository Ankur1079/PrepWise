import React from "react";
import { Activity, TrendingUp, RefreshCw } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { InterviewSession, UserProfile } from "../../types";

interface DashboardAnalyticsProps {
  interviews: InterviewSession[];
  profile: UserProfile | null;
}

interface ChartDataPoint {
  name: string;
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  date: string;
  topic: string;
}

export default function DashboardAnalytics({
  interviews,
  profile,
}: DashboardAnalyticsProps) {
  // Performance calculations
  const totalCompleted = interviews.filter(i => i.status === "completed").length;
  const filteredCompleted = interviews.filter(i => i.status === "completed" && i.score !== undefined);
  const averageScore = filteredCompleted.length > 0
    ? Math.round(filteredCompleted.reduce((acc, curr) => acc + (curr.score || 0), 0) / filteredCompleted.length)
    : 0;

  // Chart data matching performance chronological progression
  const chartData: ChartDataPoint[] = filteredCompleted
    .slice()
    .reverse()
    .map((item, index) => {
      const overall = item.score || item.feedback?.overallScore || 0;
      return {
        name: `Interv #${index + 1}`,
        overallScore: overall,
        technicalScore: item.feedback?.technicalScore || overall,
        communicationScore: item.feedback?.communicationScore || overall,
        problemSolvingScore: item.feedback?.problemSolvingScore || overall,
        date: new Date(item.createdAt).toLocaleDateString([], { month: "short", day: "numeric" }),
        topic: item.topic
      };
    });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Circular Score Widgets */}
      <div className="lg:col-span-4 rounded-2xl border border-neutral-900 bg-neutral-900/30 p-6 flex flex-col justify-between gap-6">
        <div>
          <h3 className="text-lg font-display font-bold text-neutral-150 flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-400" />
            <span>Performance Analytics</span>
          </h3>
          <p className="text-xs text-neutral-400 mt-1.5 leading-normal">
            Category and cumulative scoring progress recorded over historic evaluations.
          </p>
        </div>

        <div className="flex flex-row items-center justify-center gap-4.5 sm:gap-6 w-full">
          <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 rounded-full border-4 border-neutral-800 flex flex-col items-center justify-center font-bold text-2xl sm:text-3xl text-purple-400">
            <span className="font-display font-extrabold">{averageScore}%</span>
            <span className="text-[8px] sm:text-[9px] uppercase font-bold tracking-wider text-neutral-500 mt-0.5 sm:mt-1 font-mono">Average</span>
          </div>
          <div className="space-y-1 min-w-0">
            <p className="text-xs sm:text-sm text-neutral-400 font-medium">Overall Performance</p>
            <p className="text-sm sm:text-base text-neutral-200 font-semibold leading-tight">
              Recorded across <strong className="text-purple-400 font-mono font-bold">{totalCompleted}</strong> sessions
            </p>
          </div>
        </div>

        <div className="border-t border-neutral-800/65 pt-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs sm:text-sm text-neutral-400">
            <span className="font-medium">Integrated Profile:</span>
            <span className="text-purple-400 font-mono font-bold leading-none">{profile?.geminiEmail ? "Cloud Verified" : "Server Default"}</span>
          </div>
          <div className="flex items-center justify-between text-xs sm:text-sm text-neutral-400">
            <span className="font-medium">Custom Key Sync:</span>
            <span className={profile?.geminiApiKey ? "text-emerald-400 font-semibold" : "text-neutral-500"}>
              {profile?.geminiApiKey ? "CONNECTED" : "INACTIVE"}
            </span>
          </div>
        </div>
      </div>

      {/* Historical Progressive Trend Tracker */}
      <div className="lg:col-span-8 rounded-2xl border border-neutral-900 bg-neutral-900/30 p-6 flex flex-col justify-between min-w-0">
        <div>
          <h3 className="text-lg font-display font-bold text-neutral-150 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-400" />
            <span>Score Progression Tracker</span>
          </h3>
          <p className="text-xs text-neutral-400 mt-1.5">
            Monitor your interview quality progression and observe overall study success.
          </p>
        </div>

        {/* Rendering Real-time Chart using standard Recharts */}
        <div className="h-44 w-full mt-4">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#737373" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  dy={8}
                />
                <YAxis 
                  domain={[0, 100]} 
                  stroke="#737373" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  dx={-5}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-neutral-950/95 border border-neutral-800 rounded-xl p-3 shadow-xl backdrop-blur-md max-w-xs space-y-2 z-50">
                          <div>
                            <p className="text-xs font-bold text-neutral-200">{data.topic}</p>
                            <p className="text-[10px] text-neutral-500 font-mono font-semibold">{data.date}</p>
                          </div>
                          <div className="border-t border-neutral-900 pt-2 space-y-1">
                            <div className="flex items-center justify-between gap-4 text-xs">
                              <span className="flex items-center gap-1.5 text-neutral-400 font-medium">
                                <span className="h-2 w-2 rounded-full bg-purple-500" />
                                Overall Score:
                              </span>
                              <span className="font-bold text-purple-400 font-mono">{data.overallScore}%</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-xs">
                              <span className="flex items-center gap-1.5 text-neutral-400">
                                <span className="h-2 w-2 rounded-full bg-blue-500" />
                                Technical:
                              </span>
                              <span className="font-semibold text-blue-400 font-mono">{data.technicalScore}%</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-xs">
                              <span className="flex items-center gap-1.5 text-neutral-400">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                Communication:
                              </span>
                              <span className="font-semibold text-emerald-400 font-mono">{data.communicationScore}%</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-xs">
                              <span className="flex items-center gap-1.5 text-neutral-400">
                                <span className="h-2 w-2 rounded-full bg-amber-500" />
                                Problem Solving:
                              </span>
                              <span className="font-semibold text-amber-400 font-mono">{data.problemSolvingScore}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={30} 
                  iconType="circle"
                  iconSize={6}
                  wrapperStyle={{ fontSize: '10px', color: '#a3a3a3' }}
                />
                <Line 
                  name="Overall Score"
                  type="monotone" 
                  dataKey="overallScore" 
                  stroke="#c084fc" 
                  strokeWidth={3} 
                  activeDot={{ r: 6, stroke: '#171717', strokeWidth: 2 }}
                  dot={{ r: 4, stroke: '#c084fc', strokeWidth: 1, fill: '#171717' }}
                />
                <Line 
                  name="Technical"
                  type="monotone" 
                  dataKey="technicalScore" 
                  stroke="#3b82f6" 
                  strokeWidth={1.5} 
                  strokeDasharray="3 3"
                  dot={false}
                  opacity={0.5}
                />
                <Line 
                  name="Communication"
                  type="monotone" 
                  dataKey="communicationScore" 
                  stroke="#10b981" 
                  strokeWidth={1.5} 
                  strokeDasharray="3 3"
                  dot={false}
                  opacity={0.5}
                />
                <Line 
                  name="Problem Solving"
                  type="monotone" 
                  dataKey="problemSolvingScore" 
                  stroke="#f59e0b" 
                  strokeWidth={1.5} 
                  strokeDasharray="3 3"
                  dot={false}
                  opacity={0.5}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-neutral-500 bg-neutral-950/25 rounded-xl border border-neutral-900">
              No chronological sessions. Complete an interview to render your real-time analytics chart.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
