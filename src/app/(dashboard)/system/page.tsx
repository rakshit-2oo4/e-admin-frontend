'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Activity,
  CheckCircle2,
  X,
  RefreshCw,
  Server,
  Database,
  Cpu,
  HardDrive,
  Radio,
  Clock,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

interface DependencyCard {
  id: string;
  name: string;
  statusText: string;
  uptime: string;
  p50: string;
  p95: string;
  p99: string;
  sparklinePath: string;
  type: string;
  throughput: string;
  errorRate: string;
}

const DEPENDENCIES: DependencyCard[] = [
  {
    id: 'api',
    name: 'API',
    statusText: 'OPERATIONAL',
    uptime: '99.995%',
    p50: '46ms',
    p95: '121ms',
    p99: '288ms',
    sparklinePath: 'M 2,21 Q 20,23 38,13 T 70,11 T 98,6',
    type: 'Core Gateway',
    throughput: '3,420 req/s',
    errorRate: '0.005%',
  },
  {
    id: 'judge0',
    name: 'Judge0',
    statusText: 'OPERATIONAL',
    uptime: '99.982%',
    p50: '1.2s',
    p95: '2.8s',
    p99: '4.1s',
    sparklinePath: 'M 2,20 Q 22,22 44,14 T 74,10 T 98,7',
    type: 'Code Execution Engine',
    throughput: '142 jobs/s',
    errorRate: '0.018%',
  },
  {
    id: 'sql-runner',
    name: 'SQL Runner',
    statusText: 'OPERATIONAL',
    uptime: '99.991%',
    p50: '82ms',
    p95: '194ms',
    p99: '340ms',
    sparklinePath: 'M 2,19 Q 20,22 42,12 T 72,9 T 98,7',
    type: 'Isolated Database Sandbox',
    throughput: '89 queries/s',
    errorRate: '0.009%',
  },
  {
    id: 'postgres',
    name: 'Postgres',
    statusText: 'OPERATIONAL',
    uptime: '100.000%',
    p50: '9ms',
    p95: '24ms',
    p99: '51ms',
    sparklinePath: 'M 2,22 Q 22,23 44,15 T 72,12 T 98,6',
    type: 'Primary Cluster (Neon / pg16)',
    throughput: '4,100 iops',
    errorRate: '0.000%',
  },
  {
    id: 'redis',
    name: 'Redis',
    statusText: 'OPERATIONAL',
    uptime: '99.999%',
    p50: '2ms',
    p95: '5ms',
    p99: '11ms',
    sparklinePath: 'M 2,21 Q 22,22 42,16 T 70,12 T 98,8',
    type: 'In-Memory Cache & Token Lock',
    throughput: '12,800 ops/s',
    errorRate: '0.001%',
  },
  {
    id: 's3',
    name: 'S3 Storage',
    statusText: 'OPERATIONAL',
    uptime: '99.976%',
    p50: '68ms',
    p95: '146ms',
    p99: '231ms',
    sparklinePath: 'M 2,22 Q 24,20 46,15 T 76,10 T 98,6',
    type: 'Telemetry & Media Vault',
    throughput: '620 MB/s',
    errorRate: '0.024%',
  },
];

interface Incident {
  id: string;
  started: string;
  duration: string;
  severity: 'MINOR' | 'MAJOR' | 'CRITICAL';
  summary: string;
  status: 'RESOLVED';
  rootCause: string;
}

const INCIDENTS: Incident[] = [
  {
    id: 'inc-1',
    started: '2026-10-02 09:14',
    duration: '18m 42s',
    severity: 'MINOR',
    summary: 'Elevated API latency in eu-west-1',
    status: 'RESOLVED',
    rootCause: 'Autoscaler delay during candidate assessment surge; additional task instances provisioned.',
  },
  {
    id: 'inc-2',
    started: '2026-09-28 16:03',
    duration: '42m 09s',
    severity: 'MAJOR',
    summary: 'Judge queue processing delay',
    status: 'RESOLVED',
    rootCause: 'Transient worker node resource throttling on submission evaluation cluster.',
  },
  {
    id: 'inc-3',
    started: '2026-09-21 07:51',
    duration: '11m 31s',
    severity: 'MINOR',
    summary: 'S3 upload retries above threshold',
    status: 'RESOLVED',
    rootCause: 'Regional upstream edge network throttling; traffic successfully rerouted.',
  },
  {
    id: 'inc-4',
    started: '2026-09-12 22:20',
    duration: '1h 08m',
    severity: 'CRITICAL',
    summary: 'Postgres failover and connection recovery',
    status: 'RESOLVED',
    rootCause: 'Primary replica node hardware maintenance triggering automated secondary promotion.',
  },
];

export default function SystemStatusPage() {
  // Live updated timestamp matching design
  const [lastUpdatedTime, setLastUpdatedTime] = useState('12:44:03 UTC');
  const [selectedDependency, setSelectedDependency] = useState<DependencyCard | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // Auto-refresh timer
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const timeStr = d.toTimeString().split(' ')[0] + ' UTC';
      setLastUpdatedTime(timeStr);
    };

    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-16">
      {/* TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-none">
            System status
          </h1>
          <p className="text-xs text-slate-400 font-normal mt-1.5">
            Live health, latency and uptime across platform dependencies.
          </p>
        </div>

        {/* Header Right Meta */}
        <div className="font-mono text-[10px] text-slate-500 tracking-wider uppercase flex items-center gap-2 select-none self-start sm:self-auto">
          <span>AUTO-REFRESH 30S</span>
          <span className="text-slate-700">·</span>
          <span>UPDATED {lastUpdatedTime}</span>
        </div>
      </div>

      {/* 6 DEPENDENCY CARDS GRID (3x2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {DEPENDENCIES.map((dep) => (
          <div
            key={dep.id}
            className="bg-[#0B101B] border border-[#1A2333] hover:border-[#23334D] rounded-xl p-6 transition-all duration-150 flex flex-col justify-between space-y-4 shadow-sm"
          >
            {/* Top row: Status header */}
            <div>
              <div className="flex items-center gap-2 font-mono text-xs font-medium text-[#10B981]">
                <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-sm shadow-[#10B981]/50 flex-shrink-0" />
                <span className="tracking-wide">
                  {dep.name} · {dep.statusText}
                </span>
              </div>

              {/* Large Uptime Percentage */}
              <div className="text-3xl font-bold font-mono text-white tracking-tight mt-3">
                {dep.uptime}
              </div>

              {/* Latency Percentiles */}
              <div className="flex items-center gap-3 font-mono text-xs text-slate-400 mt-2">
                <span>p50 {dep.p50}</span>
                <span>p95 {dep.p95}</span>
                <span>p99 {dep.p99}</span>
              </div>
            </div>

            {/* Bottom row: Sparkline Curve & "View metrics ->" */}
            <div className="flex items-end justify-between pt-2 border-t border-[#131A2B]">
              {/* Amber Sparkline SVG curve */}
              <svg
                viewBox="0 0 100 28"
                className="w-28 h-7 overflow-visible"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d={dep.sparklinePath}
                  stroke="#F59E0B"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              {/* View metrics link */}
              <button
                type="button"
                onClick={() => setSelectedDependency(dep)}
                className="text-xs text-[#F59E0B] hover:text-[#FBBF24] font-medium flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>View metrics</span>
                <span className="text-sm">→</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* BOTTOM SECTION: RECENT INCIDENTS TABLE */}
      <div className="space-y-3 pt-4">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white tracking-wide">
            Recent incidents
          </h2>
          <span className="font-mono text-[10px] text-slate-500 tracking-wider uppercase">
            LAST 30 DAYS
          </span>
        </div>

        {/* Incidents Table Container */}
        <div className="bg-[#0B101B] border border-[#1A2333] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              {/* Table Header */}
              <thead>
                <tr className="border-b border-[#131A2B] text-[11px] font-mono text-slate-500 font-medium tracking-wider uppercase select-none">
                  <th className="py-3.5 px-5 w-44">STARTED</th>
                  <th className="py-3.5 px-5 w-32">DURATION</th>
                  <th className="py-3.5 px-5 w-32">SEVERITY</th>
                  <th className="py-3.5 px-5">SUMMARY</th>
                  <th className="py-3.5 px-5 text-right w-36">STATUS</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-[#131A2B] text-xs">
                {INCIDENTS.map((inc) => (
                  <tr
                    key={inc.id}
                    onClick={() => setSelectedIncident(inc)}
                    className="hover:bg-[#101625]/60 transition-colors group cursor-pointer"
                  >
                    {/* STARTED */}
                    <td className="py-4 px-5 font-mono text-slate-400">
                      {inc.started}
                    </td>

                    {/* DURATION */}
                    <td className="py-4 px-5 font-mono text-slate-300">
                      {inc.duration}
                    </td>

                    {/* SEVERITY BADGE */}
                    <td className="py-4 px-5">
                      {inc.severity === 'MINOR' && (
                        <span className="inline-block px-2.5 py-0.5 rounded font-mono text-[11px] font-semibold text-blue-400 border border-blue-500/40 bg-blue-950/40">
                          MINOR
                        </span>
                      )}
                      {inc.severity === 'MAJOR' && (
                        <span className="inline-block px-2.5 py-0.5 rounded font-mono text-[11px] font-semibold text-[#F59E0B] border border-[#B45309] bg-[#78350F]/40">
                          MAJOR
                        </span>
                      )}
                      {inc.severity === 'CRITICAL' && (
                        <span className="inline-block px-2.5 py-0.5 rounded font-mono text-[11px] font-semibold text-[#EF4444] border border-[#991B1B] bg-[#7F1D1D]/40">
                          CRITICAL
                        </span>
                      )}
                    </td>

                    {/* SUMMARY */}
                    <td className="py-4 px-5 text-slate-200 group-hover:text-white transition-colors">
                      {inc.summary}
                    </td>

                    {/* STATUS */}
                    <td className="py-4 px-5 text-right">
                      <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#10B981] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                        <span>RESOLVED</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* METRICS MODAL FOR DEPENDENCY */}
      {selectedDependency && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0B101B] border border-[#222E42] rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1A2333]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                <h3 className="text-base font-semibold text-white">
                  {selectedDependency.name} Performance Metrics
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDependency(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#0E1523] border border-[#1A2333] rounded-lg">
                <span className="text-slate-400">30-Day Uptime</span>
                <div className="text-lg font-bold font-mono text-white mt-0.5">
                  {selectedDependency.uptime}
                </div>
              </div>
              <div className="p-3 bg-[#0E1523] border border-[#1A2333] rounded-lg">
                <span className="text-slate-400">Throughput</span>
                <div className="text-lg font-bold font-mono text-[#F59E0B] mt-0.5">
                  {selectedDependency.throughput}
                </div>
              </div>
              <div className="p-3 bg-[#0E1523] border border-[#1A2333] rounded-lg">
                <span className="text-slate-400">p95 Latency</span>
                <div className="text-lg font-bold font-mono text-white mt-0.5">
                  {selectedDependency.p95}
                </div>
              </div>
              <div className="p-3 bg-[#0E1523] border border-[#1A2333] rounded-lg">
                <span className="text-slate-400">Error Rate</span>
                <div className="text-lg font-bold font-mono text-[#10B981] mt-0.5">
                  {selectedDependency.errorRate}
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#0E1523] border border-[#1A2333] rounded-lg space-y-2 text-xs">
              <span className="text-slate-400 font-mono text-[11px] uppercase">
                Dependency Topology
              </span>
              <p className="text-slate-300">
                {selectedDependency.type} deployed across active-active availability zones with multi-region failover.
              </p>
            </div>

            <div className="pt-2 flex justify-end border-t border-[#1A2333]">
              <button
                type="button"
                onClick={() => setSelectedDependency(null)}
                className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-black font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INCIDENT DETAILS MODAL */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0B101B] border border-[#222E42] rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1A2333]">
              <div>
                <span className="font-mono text-[11px] text-slate-500">Incident Details</span>
                <h3 className="text-base font-semibold text-white leading-tight">
                  {selectedIncident.summary}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIncident(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-[#131A2B]">
                <span className="text-slate-400">Timestamp</span>
                <span className="font-mono text-slate-200">{selectedIncident.started}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#131A2B]">
                <span className="text-slate-400">Duration</span>
                <span className="font-mono text-slate-200">{selectedIncident.duration}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#131A2B]">
                <span className="text-slate-400">Severity</span>
                <span className="font-mono text-slate-200">{selectedIncident.severity}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#131A2B]">
                <span className="text-slate-400">Status</span>
                <span className="font-mono text-[#10B981] font-semibold">RESOLVED</span>
              </div>
              <div className="py-2">
                <span className="text-slate-400 block mb-1">Post-Mortem Root Cause:</span>
                <p className="text-slate-300 leading-relaxed bg-[#0E1523] p-3 rounded-lg border border-[#1A2333]">
                  {selectedIncident.rootCause}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end border-t border-[#1A2333]">
              <button
                type="button"
                onClick={() => setSelectedIncident(null)}
                className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-black font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
