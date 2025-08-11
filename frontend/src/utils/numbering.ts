import type { Requirement } from '../types/project';

/**
 * 루트 레벨 요구사항의 다음 번호를 생성합니다.
 * @param siblings 같은 레벨의 요구사항들
 * @returns 다음 루트 번호 (예: "1.0", "2.0", "3.0")
 */
export function nextRootNumber(siblings: Requirement[]): string {
  const rootSiblings = siblings.filter(req => !req.parentId);
  const max = rootSiblings.reduce((m, r) => {
    const num = Math.floor(parseFloat(r.number));
    return Math.max(m, isNaN(num) ? 0 : num);
  }, 0);
  return `${max + 1}.0`;
}

/**
 * 하위 요구사항의 다음 번호를 생성합니다.
 * @param parentNumber 상위 요구사항 번호
 * @param siblings 같은 상위를 가진 하위 요구사항들
 * @returns 다음 하위 번호 (예: "1.1", "1.2", "1.1.1")
 */
export function nextChildNumber(parentNumber: string, siblings: Requirement[]): string {
  const maxLast = siblings.reduce((m, r) => {
    const parts = r.number.split('.');
    const last = parseInt(parts[parts.length - 1], 10);
    return Math.max(m, isNaN(last) ? 0 : last);
  }, 0);
  return `${parentNumber}.${maxLast + 1}`;
}

/**
 * 요구사항 번호의 깊이(레벨)를 계산합니다.
 * @param number 요구사항 번호 (예: "1.0", "1.1.2")
 * @returns 깊이 (1.0 = 0, 1.1 = 1, 1.1.2 = 2)
 */
export function getRequirementDepth(number: string): number {
  const parts = number.split('.');
  return Math.max(0, parts.length - 2);
}

/**
 * 요구사항 번호가 특정 상위의 하위인지 확인합니다.
 * @param childNumber 하위 요구사항 번호
 * @param parentNumber 상위 요구사항 번호
 * @returns 하위 관계 여부
 */
export function isChildOf(childNumber: string, parentNumber: string): boolean {
  return childNumber.startsWith(parentNumber + '.');
}

/**
 * 요구사항 번호를 정렬 가능한 형태로 변환합니다.
 * @param number 요구사항 번호
 * @returns 정렬 가능한 문자열
 */
export function getRequirementSortKey(number: string): string {
  return number
    .split('.')
    .map(part => part.padStart(3, '0'))
    .join('.');
}

/**
 * 요구사항 배열을 번호 순으로 정렬합니다.
 * @param requirements 요구사항 배열
 * @returns 정렬된 요구사항 배열
 */
export function sortRequirementsByNumber(requirements: Requirement[]): Requirement[] {
  return [...requirements].sort((a, b) => {
    const aKey = getRequirementSortKey(a.number);
    const bKey = getRequirementSortKey(b.number);
    return aKey.localeCompare(bKey);
  });
}

/**
 * 트리 구조로 요구사항을 재구성합니다.
 * @param requirements 평면 구조의 요구사항 배열
 * @returns 트리 구조의 요구사항 배열
 */
export function buildRequirementTree(requirements: Requirement[]): Requirement[] {
  const sorted = sortRequirementsByNumber(requirements);
  const tree: Requirement[] = [];
  const map = new Map<number, Requirement>();

  // 모든 요구사항을 맵에 저장하고 subRequirements 초기화
  sorted.forEach(req => {
    map.set(req.id, { ...req, subRequirements: [] });
  });

  // 트리 구조 구성
  sorted.forEach(req => {
    const requirement = map.get(req.id)!;
    
    if (!req.parentId) {
      // 루트 레벨 요구사항
      tree.push(requirement);
    } else {
      // 하위 요구사항
      const parent = map.get(req.parentId);
      if (parent) {
        parent.subRequirements.push(requirement);
      }
    }
  });

  return tree;
}