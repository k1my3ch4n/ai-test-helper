# AI Test Helper

GitHub Actions를 이용하여 AI 기반으로 테스트 코드를 자동 생성하는 도구입니다. PR(Pull Request)의 변경된 코드를 분석하고, 테스트해야 할 항목을 제안하며, 테스트 코드를 자동으로 생성합니다.

## 주요 기능

- **AI 기반 코드 분석**: Claude 또는 Gemini API를 사용하여 변경된 코드 분석
- **테스트 제안 생성**: 테스트해야 할 항목 목록을 우선순위와 함께 제공
- **테스트 코드 자동 생성**: 다양한 프로그래밍 언어에 대한 테스트 코드 생성
- **PR 코멘트**: 테스트 제안을 PR에 자동으로 코멘트
- **다양한 테스트 프레임워크 지원**: Jest, Mocha, Vitest, Pytest, JUnit 등

## 빠른 시작

### 기본 사용법 (Claude)

```yaml
name: AI Test Helper

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  generate-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: AI Test Helper
        uses: your-username/ai-test-helper@v1
        with:
          ai_provider: 'claude'
          ai_api_key: ${{ secrets.CLAUDE_API_KEY }}
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

### Gemini 사용

```yaml
- name: AI Test Helper
  uses: your-username/ai-test-helper@v1
  with:
    ai_provider: 'gemini'
    ai_api_key: ${{ secrets.GEMINI_API_KEY }}
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

## 입력 파라미터

| 파라미터 | 필수 | 기본값 | 설명 |
|----------|------|--------|------|
| `ai_provider` | O | - | AI 프로바이더 (`claude` 또는 `gemini`) |
| `ai_api_key` | O | - | AI API 키 |
| `github_token` | O | `${{ github.token }}` | GitHub 토큰 |
| `ai_model` | X | 프로바이더 기본값 | 사용할 AI 모델 |
| `output_dir` | X | `./generated-tests` | 테스트 파일 출력 디렉토리 |
| `test_framework` | X | `auto` | 테스트 프레임워크 (`jest`, `mocha`, `vitest`, `pytest`, `junit`, `auto`) |
| `add_comment` | X | `true` | PR에 테스트 제안 코멘트 추가 여부 |

## 출력값

| 출력 | 설명 |
|------|------|
| `suggestions` | 테스트 제안 JSON 배열 |
| `generated_tests` | 생성된 테스트 파일명 JSON 배열 |
| `success` | 테스트 생성 성공 여부 |

## 지원 언어

- TypeScript / JavaScript
- Python
- Java
- Go
- Rust
- C / C++
- C#
- Ruby
- PHP
- Swift
- Kotlin

## 사용 예제

### 커스텀 모델 및 출력 디렉토리

```yaml
- name: AI Test Helper
  uses: your-username/ai-test-helper@v1
  with:
    ai_provider: 'claude'
    ai_api_key: ${{ secrets.CLAUDE_API_KEY }}
    github_token: ${{ secrets.GITHUB_TOKEN }}
    ai_model: 'claude-3-opus-20240229'
    output_dir: './tests/generated'
    test_framework: 'jest'
    add_comment: 'true'
```

### 생성된 테스트 파일 커밋

```yaml
- name: AI Test Helper
  id: test-helper
  uses: your-username/ai-test-helper@v1
  with:
    ai_provider: 'gemini'
    ai_api_key: ${{ secrets.GEMINI_API_KEY }}
    github_token: ${{ secrets.GITHUB_TOKEN }}

- name: Commit generated tests
  if: steps.test-helper.outputs.success == 'true'
  run: |
    git config --local user.email "action@github.com"
    git config --local user.name "GitHub Action"
    git add ./generated-tests
    git commit -m "Add AI-generated tests" || echo "No changes to commit"
    git push
```

### 출력값 활용

```yaml
- name: AI Test Helper
  id: test-helper
  uses: your-username/ai-test-helper@v1
  with:
    ai_provider: 'claude'
    ai_api_key: ${{ secrets.CLAUDE_API_KEY }}
    github_token: ${{ secrets.GITHUB_TOKEN }}

- name: Print results
  run: |
    echo "Success: ${{ steps.test-helper.outputs.success }}"
    echo "Suggestions: ${{ steps.test-helper.outputs.suggestions }}"
    echo "Generated tests: ${{ steps.test-helper.outputs.generated_tests }}"
```

---

## 기술 스택 및 선택 이유

### 언어: TypeScript

**선택 이유:**
- GitHub Actions와의 네이티브 호환성 (Node.js 기반)
- 타입 안정성으로 인한 코드 품질 향상
- 풍부한 생태계와 라이브러리 지원

**비교 대상:**
| 언어 | 장점 | 단점 |
|------|------|------|
| TypeScript | 타입 안정성, Node.js 호환, 풍부한 생태계 | 컴파일 필요 |
| JavaScript | 컴파일 불필요, 간단한 설정 | 타입 안정성 부족 |
| Go | 빠른 실행 속도, 단일 바이너리 | GitHub Actions 통합 복잡 |
| Python | 간단한 문법, AI 라이브러리 풍부 | Node.js 대비 Actions 지원 부족 |

### AI API: Claude / Gemini 이중 지원

**선택 이유:**
- 사용자 선택권 제공
- API 장애 시 대체 가능
- 각 API의 강점 활용 가능

**비교 대상:**
| API | 장점 | 단점 |
|------|------|------|
| Claude (Anthropic) | 높은 코드 이해력, 안정적인 JSON 출력 | 비용이 상대적으로 높음 |
| Gemini (Google) | 빠른 응답 속도, 저렴한 비용 | JSON 파싱 추가 처리 필요 |
| GPT-4 (OpenAI) | 널리 사용됨, 풍부한 문서 | API 변경 빈번, 비용 높음 |

### 번들러: @vercel/ncc

**선택 이유:**
- GitHub Actions용 단일 파일 번들링에 최적화
- node_modules를 포함한 완전한 번들 생성
- 간단한 사용법

**비교 대상:**
| 번들러 | 장점 | 단점 |
|------|------|------|
| @vercel/ncc | Actions 최적화, 단순 설정 | 번들 크기 큼 |
| esbuild | 매우 빠른 빌드 | Actions 호환성 추가 설정 필요 |
| webpack | 유연한 설정, 풍부한 플러그인 | 복잡한 설정 |
| rollup | 작은 번들 크기 | 설정 복잡도 |

### 테스트 프레임워크: Jest

**선택 이유:**
- TypeScript 기본 지원 (ts-jest)
- 풍부한 매처와 모킹 기능
- 코드 커버리지 내장
- 병렬 테스트 실행

**비교 대상:**
| 프레임워크 | 장점 | 단점 |
|------|------|------|
| Jest | 올인원 솔루션, TypeScript 지원 | 초기 설정 시간 |
| Mocha + Chai | 유연한 구성, 가벼움 | 추가 라이브러리 필요 |
| Vitest | 빠른 실행, ESM 네이티브 | Jest 대비 생태계 작음 |
| AVA | 병렬 실행, 간단한 API | TypeScript 설정 복잡 |

### 패키지 매니저: npm

**선택 이유:**
- Node.js 기본 패키지 매니저
- 가장 널리 사용됨
- GitHub Actions에서 추가 설정 불필요

**비교 대상:**
| 매니저 | 장점 | 단점 |
|------|------|------|
| npm | 기본 제공, 안정적 | 상대적으로 느림 |
| yarn | 빠른 설치, 워크스페이스 | 추가 설치 필요 |
| pnpm | 디스크 효율적, 빠름 | 호환성 이슈 가능 |

---

## 기대 효과

### 개발 생산성 향상
- 테스트 코드 작성 시간 단축
- 테스트 커버리지 자동 확장
- 코드 리뷰 시 테스트 관점 제공

### 코드 품질 향상
- 일관된 테스트 패턴 적용
- 중요한 테스트 케이스 누락 방지
- AI 관점의 엣지 케이스 발견

### 팀 협업 개선
- PR에 자동 테스트 제안 코멘트
- 테스트 작성 가이드라인 제공
- 코드 리뷰 효율성 향상

---

## 프로젝트 구조

```
ai-test-helper/
├── .github/
│   └── workflows/          # CI/CD 워크플로우
├── src/
│   ├── api/                # AI API 클라이언트
│   │   ├── claude.ts       # Claude API
│   │   ├── gemini.ts       # Gemini API
│   │   └── types.ts        # 타입 정의
│   ├── git/                # Git 분석 모듈
│   │   ├── analyzer.ts     # PR 분석기
│   │   └── types.ts        # 타입 정의
│   ├── generator/          # 테스트 생성 모듈
│   │   ├── test-generator.ts
│   │   └── types.ts
│   └── index.ts            # 메인 엔트리포인트
├── tests/                  # 테스트 파일
│   ├── api/                # API 단위 테스트
│   ├── git/                # Git 단위 테스트
│   ├── generator/          # Generator 단위 테스트
│   └── integration/        # 통합 테스트
├── dist/                   # 빌드 출력 (ncc 번들)
├── action.yml              # GitHub Action 정의
├── jest.config.js          # Jest 설정
├── tsconfig.json           # TypeScript 설정
└── package.json
```

---

## 개발 환경 설정

### 요구 사항
- Node.js >= 20.0.0
- npm >= 9.0.0

### 설치

```bash
git clone https://github.com/your-username/ai-test-helper.git
cd ai-test-helper
npm install
```

### 빌드

```bash
npm run build      # TypeScript 컴파일
npm run bundle     # ncc 번들링
npm run package    # 빌드 + 번들링
```

### 테스트

```bash
npm test           # 전체 테스트 실행
npm run lint       # ESLint 검사
npm run format     # Prettier 포맷팅
```

---

## 참고 자료 (References)

### 공식 문서
- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [Anthropic Claude API](https://docs.anthropic.com/claude/reference)
- [Google Gemini API](https://ai.google.dev/docs)

### 사용된 라이브러리
- [@actions/core](https://github.com/actions/toolkit/tree/main/packages/core) - GitHub Actions 코어 라이브러리
- [@actions/github](https://github.com/actions/toolkit/tree/main/packages/github) - GitHub API 클라이언트
- [@anthropic-ai/sdk](https://github.com/anthropics/anthropic-sdk-typescript) - Anthropic Claude SDK
- [@google/generative-ai](https://github.com/google/generative-ai-js) - Google Generative AI SDK
- [@vercel/ncc](https://github.com/vercel/ncc) - 단일 파일 번들러
- [Jest](https://jestjs.io/) - 테스트 프레임워크
- [ts-jest](https://kulshekhar.github.io/ts-jest/) - Jest TypeScript 지원

### 관련 프로젝트
- [GitHub Actions Toolkit](https://github.com/actions/toolkit)
- [TypeScript Action Template](https://github.com/actions/typescript-action)

---

## 라이선스

MIT License

---

## 기여하기

버그 리포트, 기능 요청, PR을 환영합니다. 기여하기 전에 [CONTRIBUTING.md](CONTRIBUTING.md)를 참고해 주세요.
