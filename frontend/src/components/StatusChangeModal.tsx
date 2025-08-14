import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, CheckCircle, Clock, AlertCircle, Pause, XCircle } from 'lucide-react';

interface CustomStatus {
  id: number;
  name: string;
  color: string;
  description?: string;
  order: number;
}

interface StatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: string;
  onStatusChange: (newStatus: string) => void;
  customStatuses: CustomStatus[];
  requirementTitle: string;
}

const StatusChangeModal: React.FC<StatusChangeModalProps> = ({
  isOpen,
  onClose,
  currentStatus,
  onStatusChange,
  customStatuses,
  requirementTitle
}) => {
  const { t } = useTranslation();
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [isChanging, setIsChanging] = useState(false);

  // 상태별 아이콘 매핑
  const getStatusIcon = (status: string) => {
    switch (status) {
      case '완료':
        return <CheckCircle className="text-green-600" size={20} />;
      case '진행중':
        return <Clock className="text-blue-600" size={20} />;
      case '보류':
        return <Pause className="text-yellow-600" size={20} />;
      case '취소':
        return <XCircle className="text-red-600" size={20} />;
      default:
        return <AlertCircle className="text-gray-600" size={20} />;
    }
  };

  // 상태별 색상 클래스 반환
  const getStatusColorClass = (status: string, isSelected: boolean = false) => {
    const baseClass = isSelected ? 'ring-2 ring-offset-2' : '';
    
    switch (status) {
      case '완료':
        return `${baseClass} ${isSelected ? 'ring-green-500' : ''} bg-green-50 border-green-200 hover:bg-green-100`;
      case '진행중':
        return `${baseClass} ${isSelected ? 'ring-blue-500' : ''} bg-blue-50 border-blue-200 hover:bg-blue-100`;
      case '보류':
        return `${baseClass} ${isSelected ? 'ring-yellow-500' : ''} bg-yellow-50 border-yellow-200 hover:bg-yellow-100`;
      case '취소':
        return `${baseClass} ${isSelected ? 'ring-red-500' : ''} bg-red-50 border-red-200 hover:bg-red-100`;
      default:
        return `${baseClass} ${isSelected ? 'ring-gray-500' : ''} bg-gray-50 border-gray-200 hover:bg-gray-100`;
    }
  };

  const handleStatusChange = async () => {
    if (selectedStatus === currentStatus) {
      onClose();
      return;
    }

    setIsChanging(true);
    try {
      await onStatusChange(selectedStatus);
      onClose();
    } catch (error) {
      console.error('상태 변경 실패:', error);
    } finally {
      setIsChanging(false);
    }
  };

  const handleClose = () => {
    if (!isChanging) {
      setSelectedStatus(currentStatus);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('requirement.changeStatus', '상태 변경')}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isChanging}
          >
            <X size={24} />
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6">
          {/* 요구사항 제목 */}
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2">
              {t('requirement.targetRequirement', '대상 요구사항')}
            </p>
            <p className="font-medium text-gray-900 truncate" title={requirementTitle}>
              {requirementTitle}
            </p>
          </div>

          {/* 현재 상태 */}
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2">
              {t('requirement.currentStatus', '현재 상태')}
            </p>
            <div className="flex items-center space-x-2">
              {getStatusIcon(currentStatus)}
              <span className="font-medium">{currentStatus}</span>
            </div>
          </div>

          {/* 상태 선택 */}
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-3">
              {t('requirement.selectNewStatus', '새로운 상태 선택')}
            </p>
            <div className="space-y-2">
              {customStatuses.map((status) => (
                <button
                  key={status.id}
                  onClick={() => setSelectedStatus(status.name)}
                  disabled={isChanging}
                  className={`w-full p-3 border rounded-lg transition-all duration-200 ${getStatusColorClass(
                    status.name,
                    selectedStatus === status.name
                  )} ${isChanging ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(status.name)}
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900">{status.name}</div>
                      {status.description && (
                        <div className="text-sm text-gray-600">{status.description}</div>
                      )}
                    </div>
                    {selectedStatus === status.name && (
                      <CheckCircle className="text-blue-600" size={16} />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            disabled={isChanging}
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleStatusChange}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors flex items-center"
            disabled={isChanging || selectedStatus === currentStatus}
          >
            {isChanging ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {t('common.changing', '변경 중...')}
              </>
            ) : (
              <>
                <CheckCircle size={16} className="mr-2" />
                {t('common.change', '변경')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusChangeModal;