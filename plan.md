# AI Test Helper - 프로젝트 계획

## 프로젝트 개요

GitHub Actions를 이용하여 AI 기반 테스트 코드 작성을 자동화하는 도구

## 작업 단계

### Phase 1: 프로젝트 초기 설정 ✅ 완료
- [x] 프로젝트 구조 설계
- [x] package.json 생성 및 기본 의존성 설정
- [x] TypeScript 설정
- [x] ESLint/Prettier 설정

### Phase 2: 핵심 기능 구현 ✅ 완료
- [x] AI API 연동 모듈 개발
  - [x] Claude API 클라이언트 구현
  - [x] Gemini API 클라이언트 구현
  - [x] API 키 관리 및 환경변수 처리
- [x] Git 변경사항 분석 모듈 개발
  - [x] 변경된 파일 목록 추출
  - [x] 변경된 코드 diff 분석
- [x] 테스트 코드 생성 모듈 개발
  - [x] 테스트 대상 동작 목록 생성
  - [x] 테스트 코드 자동 생성
  - [x] 생성된 코드 검증

### Phase 3: GitHub Actions 통합
- [ ] GitHub Action 정의 파일 작성 (action.yml)
- [ ] Action 입력/출력 파라미터 설계
- [ ] Workflow 예제 작성
- [ ] Marketplace 배포 준비

### Phase 4: 테스트 및 문서화
- [ ] 단위 테스트 작성
- [ ] 통합 테스트 작성
- [ ] README.md 작성
- [ ] 사용 예제 문서화

## 기술 스택

| 분류 | 기술 | 선택 이유 |
|------|------|-----------|
| 언어 | TypeScript | 타입 안정성, GitHub Actions와 호환성 |
| AI API | Claude/Gemini | 사용자 선택 가능하도록 구현 |
| 패키지 매니저 | npm | Node.js 기본 패키지 매니저, 안정성 |
| 테스트 프레임워크 | Jest | TypeScript 지원, 풍부한 기능 |
| 린터 | ESLint + Prettier | 코드 품질 및 일관성 유지 |

## 프로젝트 구조

```
ai-test-helper/
├── src/
│   ├── index.ts              # 메인 엔트리포인트
│   ├── api/
│   │   ├── index.ts          # API 모듈 export
│   │   ├── types.ts          # 공통 타입 정의
│   │   ├── claude.ts         # Claude API 클라이언트
│   │   └── gemini.ts         # Gemini API 클라이언트
│   ├── git/
│   │   ├── index.ts          # Git 모듈 export
│   │   ├── types.ts          # Git 타입 정의
│   │   └── analyzer.ts       # Git 분석기
│   └── generator/
│       ├── index.ts          # Generator 모듈 export
│       ├── types.ts          # Generator 타입 정의
│       └── test-generator.ts # 테스트 생성기
├── tests/                    # 테스트 파일
├── dist/                     # 빌드 출력
├── action.yml                # GitHub Action 정의
├── package.json
├── tsconfig.json
├── .eslintrc.js
└── .prettierrc
```

## 구현된 기능

### AI API 모듈 (`src/api/`)
- **AIClient 인터페이스**: 공통 AI 클라이언트 인터페이스
- **ClaudeClient**: Anthropic Claude API 연동
- **GeminiClient**: Google Gemini API 연동
- **createAIClient**: 프로바이더별 클라이언트 팩토리

### Git 분석 모듈 (`src/git/`)
- **GitAnalyzer**: GitHub API를 통한 PR 분석
- PR 정보, 변경 파일 목록, diff 추출
- 코드 파일 필터링

### 테스트 생성 모듈 (`src/generator/`)
- **TestGenerator**: AI를 활용한 테스트 코드 생성
- 테스트 제안 생성
- 테스트 코드 자동 생성 및 저장

## 진행 상태

- **현재 단계**: Phase 3 - GitHub Actions 통합
- **최종 수정일**: 2026-01-12
- **다음 작업**: GitHub Action 정의 파일 작성

## 변경 이력

| 날짜 | 변경 내용 |
|------|-----------|
| 2026-01-12 | 초기 계획 수립 |
| 2026-01-12 | Phase 1 완료 - 프로젝트 초기 설정 |
| 2026-01-12 | Phase 2 완료 - 핵심 기능 구현 |
