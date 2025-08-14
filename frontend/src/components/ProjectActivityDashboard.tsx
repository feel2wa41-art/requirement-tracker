import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  TrendingUp, 
  Activity, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  Calendar,
  Users,
  RefreshCw,
  Download
} from 'lucide-react';
import axios from 'axios';

interface ProjectStats {
  timelineStats: Array<{
    _id: string;
    changes: Array<{
      type: string;
      count: number;
    }>;
    totalChanges: number;
  }>;
  changeTypeSummary: { [key: string]: number };
  totalChanges: number;
  recentActivity: Array<{
    id: number;
    changeType: string;
    changedBy: string;
    timestamp: string;
    requirement?: {
      number: string;
      title: string;
    };
  }>;
  frequentlyChangedRequirements: Array<{
    _id: number;
    changeCount: number;
    lastChanged: string;
    requirement?: {
      number: string;
      title: string;
      status: string;
    };
  }>;
  period: string;
}

interface ProjectActivityDashboardProps {
  projectId: number;
  projectName?: string;
}

const ProjectActivityDashboard: React.FC<ProjectActivityDashboardProps> = ({
  projectId,
  projectName
}) => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30');

  useEffect(() => {
    loadStats();
  }, [projectId, selectedPeriod]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`/api/history/stats/${projectId}?days=${selectedPeriod}`);
      
      if (response.data.success) {
        setStats(response.data.data);
      } else {
        setError(response.data.message || '통계를 불러오는데 실패했습니다.');
      }
    } catch (err: any) {
      console.error('통계 로드 실패:', err);
      setError(err.response?.data?.message || '통계를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getChangeTypeColor = (changeType: string) => {
    const colors: { [key: string]: string } = {
      created: 'bg-green-500',
      status_changed: 'bg-blue-500',
      title_changed: 'bg-orange-500',
      description_changed: 'bg-orange-400',
      priority_changed: 'bg-purple-500',
      assigned: 'bg-indigo-500',
      deleted: 'bg-red-500'
    };
    return colors[changeType] || 'bg-gray-500';
  };

  const getChangeTypeLabel = (changeType: string) => {
    const labels: { [key: string]: string } = {
      created: '생성',
      status_changed: '상태변경',
      title_changed: '제목변경',
      description_changed: '설명변경',
      priority_changed: '우선순위변경',
      assigned: '할당',
      deleted: '삭제'
    };
    return labels[changeType] || changeType;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    });
  };

  const exportData = () => {
    if (!stats) return;
    
    // CSV 형식으로 내보내기
    const csvData = [
      ['Export Information'],
      ['Project', projectName || `프로젝트 ${projectId}`],
      ['Period', stats.period],
      ['Total Changes', stats.totalChanges.toString()],
      ['Export Date', new Date().toLocaleString('ko-KR')],
      [''],
      ['Change Type Summary'],
      ['Change Type', 'Count'],
      ...Object.entries(stats.changeTypeSummary).map(([type, count]) => [
        getChangeTypeLabel(type), count.toString()
      ]),
      [''],
      ['Recent Activity'],
      ['Change Type', 'Changed By', 'Requirement', 'Timestamp'],
      ...stats.recentActivity.slice(0, 20).map(activity => [
        getChangeTypeLabel(activity.changeType),
        activity.changedBy,
        activity.requirement ? `${activity.requirement.number} - ${activity.requirement.title}` : 'N/A',
        new Date(activity.timestamp).toLocaleString('ko-KR')
      ]),
      [''],
      ['Frequently Changed Requirements'],
      ['Rank', 'Requirement', 'Change Count', 'Last Changed'],
      ...stats.frequentlyChangedRequirements.slice(0, 10).map((req, index) => [
        (index + 1).toString(),
        req.requirement ? `${req.requirement.number} - ${req.requirement.title}` : `ID: ${req._id}`,
        req.changeCount.toString(),
        new Date(req.lastChanged).toLocaleString('ko-KR')
      ])
    ];

    const csvContent = csvData.map(row => 
      Array.isArray(row) ? row.map(cell => `"${cell}"`).join(',') : `"${row}"`
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-${projectId}-activity-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
          <button
            onClick={loadStats}
            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {projectName || `프로젝트 ${projectId}`} 활동 통계
          </h2>
          <p className="text-gray-600">{stats.period} 데이터</p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="7">최근 7일</option>
            <option value="30">최근 30일</option>
            <option value="90">최근 90일</option>
          </select>
          <button
            onClick={loadStats}
            className="p-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md"
            title="새로고침"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={exportData}
            className="p-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md"
            title="데이터 내보내기"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <Activity className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">총 변경사항</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalChanges}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">상태 변경</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.changeTypeSummary.status_changed || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-orange-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">신규 생성</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.changeTypeSummary.created || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-purple-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">활동한 사용자</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(stats.recentActivity.map(a => a.changedBy)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 변경 유형별 통계 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <PieChart className="w-5 h-5 text-gray-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">변경 유형별 통계</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(stats.changeTypeSummary)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded ${getChangeTypeColor(type)} mr-3`}></div>
                    <span className="text-sm text-gray-700">
                      {getChangeTypeLabel(type)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900 mr-2">{count}</span>
                    <span className="text-xs text-gray-500">
                      ({((count / stats.totalChanges) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* 자주 변경되는 요구사항 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <BarChart3 className="w-5 h-5 text-gray-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">자주 변경되는 요구사항</h3>
          </div>
          <div className="space-y-3">
            {stats.frequentlyChangedRequirements.slice(0, 5).map((req, index) => (
              <div key={req._id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900 mr-2">
                      #{index + 1}
                    </span>
                    {req.requirement && (
                      <span className="text-sm text-gray-700">
                        {req.requirement.number} - {req.requirement.title}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center mt-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3 mr-1" />
                    마지막 변경: {new Date(req.lastChanged).toLocaleDateString('ko-KR')}
                  </div>
                </div>
                <span className="text-sm font-bold text-red-600">
                  {req.changeCount}회
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 최근 활동 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <Clock className="w-5 h-5 text-gray-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">최근 활동</h3>
        </div>
        <div className="space-y-3">
          {stats.recentActivity.slice(0, 10).map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${getChangeTypeColor(activity.changeType)}`}></div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {getChangeTypeLabel(activity.changeType)}
                    </span>
                    {activity.requirement && (
                      <span className="text-sm text-gray-600">
                        {activity.requirement.number} - {activity.requirement.title}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Users className="w-3 h-3 mr-1" />
                    {activity.changedBy}
                  </div>
                </div>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(activity.timestamp).toLocaleString('ko-KR')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectActivityDashboard;