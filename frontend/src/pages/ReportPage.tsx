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
  RefreshCw
} from 'lucide-react';
import axios from 'axios';

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

const mockReportData: ReportData = {
  summary: {
    totalProjects: 5,
    totalRequirements: 150,
    completedRequirements: 85,
    inProgressRequirements: 35,
    pendingRequirements: 30
  },
  projectStats: [
    {
      projectName: '웹 포털 시스템',
      totalRequirements: 45,
      completed: 30,
      inProgress: 10,
      pending: 5,
      completionRate: 66.7
    },
    {
      projectName: '모바일 앱',
      totalRequirements: 35,
      completed: 25,
      inProgress: 8,
      pending: 2,
      completionRate: 71.4
    },
    {
      projectName: 'API 서버',
      totalRequirements: 40,
      completed: 20,
      inProgress: 12,
      pending: 8,
      completionRate: 50.0
    }
  ],
  categoryStats: [
    { category: '기능적 요구사항', count: 90, percentage: 60 },
    { category: '비기능적 요구사항', count: 35, percentage: 23.3 },
    { category: '시스템 요구사항', count: 25, percentage: 16.7 }
  ],
  timelineData: [
    { date: '2024-01-01', created: 15, completed: 8 },
    { date: '2024-01-02', created: 20, completed: 12 },
    { date: '2024-01-03', created: 18, completed: 15 },
    { date: '2024-01-04', created: 25, completed: 20 },
    { date: '2024-01-05', created: 12, completed: 18 }
  ]
};

const ReportPage: React.FC = () => {
  const { t } = useTranslation();
  const [reportType, setReportType] = useState<'summary' | 'detailed' | 'export'>('summary');
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: {
      start: '2024-01-01',
      end: '2024-01-31'
    },
    status: [],
    category: []
  });
  const [reportData, setReportData] = useState<ReportData>(mockReportData);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  // 실제 데이터 로드
  useEffect(() => {
    loadReportData();
  }, []);

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
          timelineData: mockReportData.timelineData // 타임라인은 mock 데이터 사용
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
    // 실제로는 API 호출
    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
  };

  const handleExportPDF = () => {
    // PDF 내보내기 로직
    console.log('PDF 내보내기');
  };

  const handleExportExcel = () => {
    // Excel 내보내기 로직
    console.log('Excel 내보내기');
  };

  const handlePrint = () => {
    if (printRef.current) {
      window.print();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'inProgress': return 'bg-yellow-500';
      case 'pending': return 'bg-gray-500';
      default: return 'bg-gray-500';
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
        <p className="text-gray-600">프로젝트 진행 상황과 요구사항 통계를 확인할 수 있습니다.</p>
      </div>

      {/* 보고서 유형 선택 */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          {[
            { key: 'summary', label: '요약 보고서', icon: BarChart3 },
            { key: 'detailed', label: '상세 보고서', icon: FileText },
            { key: 'export', label: '내보내기', icon: Download }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setReportType(key as any)}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                reportType === key
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 필터 섹션 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          보고서 필터
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              시작 날짜
            </label>
            <input
              type="date"
              value={filters.dateRange.start}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, start: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              종료 날짜
            </label>
            <input
              type="date"
              value={filters.dateRange.end}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, end: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  보고서 생성
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 보고서 내용 */}
      <div ref={printRef} className="bg-white rounded-lg shadow">
        {reportType === 'summary' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">요약 보고서</h2>
              <div className="flex space-x-2">
                <button
                  onClick={handlePrint}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  인쇄
                </button>
                <button
                  onClick={() => {}}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  공유
                </button>
              </div>
            </div>

            {/* 전체 통계 */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {reportData.summary.totalProjects}
                </div>
                <div className="text-sm text-gray-600">총 프로젝트</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {reportData.summary.totalRequirements}
                </div>
                <div className="text-sm text-gray-600">총 요구사항</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {reportData.summary.completedRequirements}
                </div>
                <div className="text-sm text-gray-600">완료</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {reportData.summary.inProgressRequirements}
                </div>
                <div className="text-sm text-gray-600">진행 중</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">
                  {reportData.summary.pendingRequirements}
                </div>
                <div className="text-sm text-gray-600">대기</div>
              </div>
            </div>

            {/* 프로젝트별 통계 */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">프로젝트별 진행 현황</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        프로젝트명
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        총 요구사항
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        완료
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        진행 중
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        대기
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        완료율
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.projectStats.map((project, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {project.projectName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {project.totalRequirements}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                          {project.completed}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                          {project.inProgress}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {project.pending}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${project.completionRate}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-500">
                              {project.completionRate.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 카테고리별 분포 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">카테고리별 분포</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {reportData.categoryStats.map((category, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {category.category}
                      </span>
                      <span className="text-sm text-gray-500">
                        {category.count}개
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-right text-xs text-gray-500 mt-1">
                      {category.percentage.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {reportType === 'export' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">보고서 내보내기</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <FileText className="h-8 w-8 text-red-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">PDF 보고서</h3>
                    <p className="text-sm text-gray-500">인쇄 가능한 PDF 형식</p>
                  </div>
                </div>
                <button
                  onClick={handleExportPDF}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF 다운로드
                </button>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <BarChart3 className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Excel 보고서</h3>
                    <p className="text-sm text-gray-500">데이터 분석용 Excel 형식</p>
                  </div>
                </div>
                <button
                  onClick={handleExportExcel}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Excel 다운로드
                </button>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">내보내기 옵션</h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  <span className="text-sm text-blue-800">전체 통계 포함</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  <span className="text-sm text-blue-800">프로젝트별 세부 사항 포함</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-sm text-blue-800">차트 및 그래프 포함</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportPage;