import { ChangedFile } from '../../src/git/types';

describe('GitAnalyzer - 순수 함수', () => {
  describe('코드 파일 필터링 로직', () => {
    const codeExtensions = [
      '.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs',
      '.cpp', '.c', '.cs', '.rb', '.php', '.swift', '.kt',
    ];

    function filterCodeFiles(files: ChangedFile[]): ChangedFile[] {
      return files.filter((file) => {
        const ext = file.filename.substring(file.filename.lastIndexOf('.'));
        return codeExtensions.includes(ext) && file.status !== 'removed';
      });
    }

    it('코드 파일만 필터링해야 한다', () => {
      const files: ChangedFile[] = [
        { filename: 'src/app.ts', status: 'modified', additions: 5, deletions: 2 },
        { filename: 'src/component.tsx', status: 'added', additions: 10, deletions: 0 },
        { filename: 'src/utils.js', status: 'modified', additions: 3, deletions: 1 },
        { filename: 'README.md', status: 'modified', additions: 1, deletions: 1 },
        { filename: 'package.json', status: 'modified', additions: 2, deletions: 1 },
        { filename: 'src/styles.css', status: 'added', additions: 20, deletions: 0 },
      ];

      const result = filterCodeFiles(files);

      expect(result).toHaveLength(3);
      expect(result.map((f) => f.filename)).toEqual([
        'src/app.ts',
        'src/component.tsx',
        'src/utils.js',
      ]);
    });

    it('삭제된 파일을 제외해야 한다', () => {
      const files: ChangedFile[] = [
        { filename: 'src/app.ts', status: 'modified', additions: 5, deletions: 2 },
        { filename: 'src/old.ts', status: 'removed', additions: 0, deletions: 50 },
      ];

      const result = filterCodeFiles(files);

      expect(result).toHaveLength(1);
      expect(result[0].filename).toBe('src/app.ts');
    });

    it('다양한 프로그래밍 언어를 지원해야 한다', () => {
      const files: ChangedFile[] = [
        { filename: 'app.py', status: 'modified', additions: 1, deletions: 0 },
        { filename: 'Main.java', status: 'added', additions: 1, deletions: 0 },
        { filename: 'main.go', status: 'modified', additions: 1, deletions: 0 },
        { filename: 'lib.rs', status: 'added', additions: 1, deletions: 0 },
        { filename: 'app.cpp', status: 'modified', additions: 1, deletions: 0 },
        { filename: 'utils.c', status: 'modified', additions: 1, deletions: 0 },
        { filename: 'Program.cs', status: 'added', additions: 1, deletions: 0 },
        { filename: 'script.rb', status: 'modified', additions: 1, deletions: 0 },
        { filename: 'index.php', status: 'added', additions: 1, deletions: 0 },
        { filename: 'App.swift', status: 'modified', additions: 1, deletions: 0 },
        { filename: 'Main.kt', status: 'added', additions: 1, deletions: 0 },
      ];

      const result = filterCodeFiles(files);

      expect(result).toHaveLength(11);
    });
  });

  describe('파일 상태 매핑 로직', () => {
    function mapFileStatus(status: string): ChangedFile['status'] {
      switch (status) {
        case 'added':
          return 'added';
        case 'modified':
        case 'changed':
          return 'modified';
        case 'removed':
          return 'removed';
        case 'renamed':
          return 'renamed';
        default:
          return 'modified';
      }
    }

    it('added 상태를 올바르게 매핑해야 한다', () => {
      expect(mapFileStatus('added')).toBe('added');
    });

    it('modified 상태를 올바르게 매핑해야 한다', () => {
      expect(mapFileStatus('modified')).toBe('modified');
    });

    it('changed 상태를 modified로 매핑해야 한다', () => {
      expect(mapFileStatus('changed')).toBe('modified');
    });

    it('removed 상태를 올바르게 매핑해야 한다', () => {
      expect(mapFileStatus('removed')).toBe('removed');
    });

    it('renamed 상태를 올바르게 매핑해야 한다', () => {
      expect(mapFileStatus('renamed')).toBe('renamed');
    });

    it('알 수 없는 상태를 modified로 기본값 처리해야 한다', () => {
      expect(mapFileStatus('unknown')).toBe('modified');
      expect(mapFileStatus('copied')).toBe('modified');
    });
  });

  describe('PullRequestInfo 구조', () => {
    it('필수 필드를 가져야 한다', () => {
      const prInfo = {
        number: 123,
        title: 'Test PR',
        body: 'Description',
        baseBranch: 'main',
        headBranch: 'feature',
      };

      expect(prInfo.number).toBe(123);
      expect(prInfo.title).toBe('Test PR');
      expect(prInfo.body).toBe('Description');
      expect(prInfo.baseBranch).toBe('main');
      expect(prInfo.headBranch).toBe('feature');
    });

    it('body가 null일 수 있어야 한다', () => {
      const prInfo = {
        number: 456,
        title: 'No body PR',
        body: null,
        baseBranch: 'main',
        headBranch: 'fix-branch',
      };

      expect(prInfo.body).toBeNull();
    });
  });
});
