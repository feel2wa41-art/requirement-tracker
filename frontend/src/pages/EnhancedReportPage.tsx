import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Download, 
  FileText, 
  Calendar, 
  Filter, 
  BarChart3,
  PieChart,
  Printer,
  Share2,
  RefreshCw,
  History,
  Activity,
  TrendingUp
} from 'lucide-react';
import axios from 'axios';
import RequirementHistoryView from '../components/RequirementHistoryView';
import ProjectActivityDashboard from '../components/ProjectActivityDashboard';

interface ReportFilters {
  projectId?: string;
  dateRange: {
    start: string;
    end: string;
  };
  status?: string[];
  category?: string[];
}

interface ReportData {
  summary: {
    totalProjects: number;
    totalRequirements: number;
    completedRequirements: number;
    inProgressRequirements: number;
    pendingRequirements: number;
  };
  projectStats: Array<{
    projectName: string;
    totalRequirements: number;
    completed: number;
    inProgress: number;
    pending: number;
    completionRate: number;
  }>;
  categoryStats: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  timelineData: Array<{
    date: string;
    created: number;
    completed: number;
  }>;
}

const EnhancedReportPage: React.FC = () => {
  const { t } = useTranslation();
  const [reportType, setReportType] = useState<'summary' | 'detailed' | 'export' | 'history' | 'activity'>('summary');
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: {
      start: '2024-01-01',
      end: '2024-01-31'
    },
    status: [],
    category: []
  });
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // 실제 데이터 로드
  useEffect(() => {
    loadReportData();
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await axios.get('/api/projects');
      if (response.data.success) {
        setProjects(response.data.data.projects || []);
        if (response.data.data.projects.length > 0 && !selectedProjectId) {
          setSelectedProjectId(response.data.data.projects[0].id);
        }
      }
    } catch (err) {
      console.error('프로젝트 목록 로드 실패:', err);
    }
  };

  const loadReportData = async () => {
    try {
      setLoading(true);
      
      // 프로젝트 목록 가져오기
      const projectsResponse = await axios.get('/api/projects');
      if (projectsResponse.data.success) {
        const projects = projectsResponse.data.data.projects || [];
        
        // 각 프로젝트의 요구사항 통계 계산
        let totalRequirements = 0;
        let totalCompleted = 0;
        let totalInProgress = 0;
        let totalPending = 0;
        
        const projectStats = [];
        
        for (const project of projects) {
          try {
            const reqResponse = await axios.get(`/api/requirements/project/${project.id}`);
            if (reqResponse.data.success) {
              const requirements = reqResponse.data.data.requirements || [];
              const flatRequirements = flattenRequirements(requirements);
              
              const completed = flatRequirements.filter(req => req.status === '완료').length;
              const inProgress = flatRequirements.filter(req => req.status === '진행중').length;
              const pending = flatRequirements.filter(req => req.status === '요청').length;
              
              totalRequirements += flatRequirements.length;
              totalCompleted += completed;
              totalInProgress += inProgress;
              totalPending += pending;
              
              projectStats.push({
                projectName: project.name,
                totalRequirements: flatRequirements.length,
                completed,
                inProgress,
                pending,
                completionRate: flatRequirements.length > 0 ? (completed / flatRequirements.length) * 100 : 0
              });
            }
          } catch (err) {
            console.error('요구사항 로드 실패:', err);
          }
        }
        
        // 카테고리별 통계 (기본값 사용)
        const categoryStats = [
          { 
            category: '기능적 요구사항', 
            count: Math.floor(totalRequirements * 0.6), 
            percentage: 60 
          },
          { 
            category: '비기능적 요구사항', 
            count: Math.floor(totalRequirements * 0.25), 
            percentage: 25 
          },
          { 
            category: '시스템 요구사항', 
            count: Math.floor(totalRequirements * 0.15), 
            percentage: 15 
          }
        ];
        
        // 타임라인 데이터 (목데이터)
        const timelineData = [
          { date: '2024-01-01', created: 15, completed: 8 },
          { date: '2024-01-02', created: 20, completed: 12 },
          { date: '2024-01-03', created: 18, completed: 15 },
          { date: '2024-01-04', created: 25, completed: 20 },
          { date: '2024-01-05', created: 12, completed: 18 }
        ];
        
        setReportData({
          summary: {
            totalProjects: projects.length,
            totalRequirements,
            completedRequirements: totalCompleted,
            inProgressRequirements: totalInProgress,
            pendingRequirements: totalPending
          },
          projectStats,
          categoryStats,
          timelineData
        });
      }
    } catch (err) {
      console.error('보고서 데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 요구사항 트리를 평면화하는 함수
  const flattenRequirements = (reqs: any[]): any[] => {
    const result: any[] = [];
    reqs.forEach(req => {
      result.push(req);
      if (req.children) {
        result.push(...flattenRequirements(req.children));
      }
    });
    return result;
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    await loadReportData();
    setTimeout(() => {
      setIsGenerating(false);
    }, 1000);
  };

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    if (!reportData) return;

    switch (format) {
      case 'csv':
        exportToCSV();
        break;
      case 'excel':
        exportToExcel();
        break;
      case 'pdf':
        exportToPDF();
        break;
      default:
        console.log(`Exporting in ${format} format`);
    }
  };

  const exportToCSV = () => {
    if (!reportData) return;

    const csvData = [
      // 헤더
      ['Type', 'Data', 'Value', 'Details'],
      
      // 요약 데이터
      ['Summary', 'Total Projects', reportData.summary.totalProjects, ''],
      ['Summary', 'Total Requirements', reportData.summary.totalRequirements, ''],
      ['Summary', 'Completed Requirements', reportData.summary.completedRequirements, ''],
      ['Summary', 'In Progress Requirements', reportData.summary.inProgressRequirements, ''],
      ['Summary', 'Pending Requirements', reportData.summary.pendingRequirements, ''],
      
      // 구분자
      ['', '', '', ''],
      
      // 프로젝트 통계
      ['Project Stats', 'Project Name', 'Total', 'Completed', 'In Progress', 'Pending', 'Completion Rate'],
      ...reportData.projectStats.map(project => [
        'Project Stats',
        project.projectName,
        project.totalRequirements,
        project.completed,
        project.inProgress,
        project.pending,
        `${project.completionRate.toFixed(1)}%`
      ]),
      
      // 구분자
      ['', '', '', '', '', '', ''],
      
      // 카테고리 통계
      ['Category Stats', 'Category', 'Count', 'Percentage'],
      ...reportData.categoryStats.map(category => [
        'Category Stats',
        category.category,
        category.count,
        `${category.percentage}%`
      ])
    ];

    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `requirement-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    // Excel 내보내기 - 향후 구현
    alert('Excel 내보내기 기능은 개발 중입니다.');
  };

  const exportToPDF = () => {
    // PDF 내보내기 - 향후 구현
    alert('PDF 내보내기 기능은 개발 중입니다.');
  };

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current;
      const originalContent = document.body.innerHTML;
      document.body.innerHTML = printContent.innerHTML;
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">보고서 데이터를 불러오는 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">고급 보고서</h1>
        <p className="text-gray-600">프로젝트 진행 상황, 요구사항 통계 및 변경 이력을 확인할 수 있습니다.</p>
      </div>

      {/* 보고서 유형 선택 */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          {[
            { key: 'summary', label: '요약 보고서', icon: BarChart3 },
            { key: 'history', label: '변경 이력', icon: History },
            { key: 'activity', label: '프로젝트 활동', icon: Activity },
            { key: 'detailed', label: '상세 보고서', icon: FileText },
            { key: 'export', label: '내보내기', icon: Download }
          ].map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.key}
                onClick={() => setReportType(type.key as any)}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  reportType === type.key
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {type.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 프로젝트 선택 (이력/활동 탭에서만 표시) */}
      {(reportType === 'history' || reportType === 'activity') && (
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">프로젝트 선택:</label>
            <select
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId(e.target.value ? parseInt(e.target.value) : null)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">전체 프로젝트</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex space-x-3">
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isGenerating ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <BarChart3 className="w-4 h-4 mr-2" />
            )}
            {isGenerating ? '생성 중...' : '보고서 갱신'}
          </button>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handlePrint}
            className="flex items-center px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Printer className="w-4 h-4 mr-2" />
            인쇄
          </button>
          <button
            className="flex items-center px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Share2 className="w-4 h-4 mr-2" />
            공유
          </button>
        </div>
      </div>

      {/* 보고서 내용 */}
      <div ref={printRef} className="space-y-6">
        {reportType === 'summary' && reportData && (
          <SummaryReport reportData={reportData} />
        )}
        
        {reportType === 'detailed' && reportData && (
          <DetailedReport reportData={reportData} filters={filters} />
        )}
        
        {reportType === 'export' && reportData && (
          <ExportReport reportData={reportData} onExport={handleExport} />
        )}
        
        {reportType === 'history' && selectedProjectId && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <History className="w-5 h-5 text-gray-500 mr-2" />
              <h2 className="text-xl font-bold text-gray-900">요구사항 변경 이력</h2>
            </div>
            <RequirementHistoryView 
              projectId={selectedProjectId}
              showProjectFilter={false}
            />
          </div>
        )}
        
        {reportType === 'activity' && selectedProjectId && (
          <ProjectActivityDashboard 
            projectId={selectedProjectId}
            projectName={projects.find(p => p.id === selectedProjectId)?.name}
          />
        )}
      </div>
    </div>
  );
};

// 요약 보고서 컴포넌트
const SummaryReport: React.FC<{ reportData: ReportData }> = ({ reportData }) => {
  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">총 프로젝트</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.summary.totalProjects}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">총 요구사항</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.summary.totalRequirements}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">완료된 요구사항</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.summary.completedRequirements}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100">
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">진행 중</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.summary.inProgressRequirements}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 프로젝트별 통계 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">프로젝트별 진행률</h3>
        <div className="space-y-4">
          {reportData.projectStats.map((project, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">{project.projectName}</span>
                <span className="text-sm text-gray-500">
                  {project.completed}/{project.totalRequirements} ({project.completionRate.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${project.completionRate}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 상세 보고서 컴포넌트
const DetailedReport: React.FC<{ reportData: ReportData; filters: ReportFilters }> = ({ reportData, filters }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">상세 분석</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 카테고리별 통계 */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">카테고리별 분포</h4>
          <div className="space-y-3">
            {reportData.categoryStats.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{category.category}</span>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900 mr-2">{category.count}</span>
                  <span className="text-sm text-gray-500">({category.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 시간별 추이 */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">일별 요구사항 추이</h4>
          <div className="space-y-2">
            {reportData.timelineData.map((data, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{data.date}</span>
                <div className="flex space-x-4">
                  <span className="text-blue-600">생성: {data.created}</span>
                  <span className="text-green-600">완료: {data.completed}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// 내보내기 보고서 컴포넌트
const ExportReport: React.FC<{ reportData: ReportData; onExport: (format: string) => void }> = ({ reportData, onExport }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">보고서 내보내기</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { format: 'pdf', label: 'PDF 파일', description: '인쇄 및 공유에 적합' },
          { format: 'excel', label: 'Excel 파일', description: '데이터 분석에 적합' },
          { format: 'csv', label: 'CSV 파일', description: '데이터 가공에 적합' }
        ].map((option) => (
          <button
            key={option.format}
            onClick={() => onExport(option.format)}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
          >
            <h4 className="font-medium text-gray-900">{option.label}</h4>
            <p className="text-sm text-gray-600 mt-1">{option.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default EnhancedReportPage;