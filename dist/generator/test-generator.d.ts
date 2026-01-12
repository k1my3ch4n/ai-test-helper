import { AIClient, GeneratedTest } from '../api/types';
import { ChangedFile } from '../git/types';
import { TestGeneratorConfig, TestGenerationResult } from './types';
export declare class TestGenerator {
    private aiClient;
    private config;
    constructor(aiClient: AIClient, config: TestGeneratorConfig);
    /**
     * 변경된 파일들에 대한 테스트 생성
     */
    generateTests(changedFiles: ChangedFile[], diff: string, getFileContent: (path: string) => Promise<string>): Promise<TestGenerationResult>;
    /**
     * 단일 파일에 대한 테스트 생성
     */
    private generateTestForFile;
    /**
     * 생성된 테스트 파일 저장
     */
    saveGeneratedTests(tests: GeneratedTest[]): Promise<string[]>;
    /**
     * 테스트 파일명 생성
     */
    private getTestFileName;
    /**
     * 테스트 파일 접미사 반환
     */
    private getTestSuffix;
    /**
     * 파일 확장자로 언어 감지
     */
    private detectLanguage;
    /**
     * 코드 파일만 필터링
     */
    private filterCodeFiles;
    /**
     * 테스트 파일인지 확인
     */
    private isTestFile;
    /**
     * 파일 관련 제안 필터링
     */
    private filterSuggestionsForFile;
}
//# sourceMappingURL=test-generator.d.ts.map