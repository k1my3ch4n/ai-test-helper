import * as core from '@actions/core';

async function run(): Promise<void> {
  try {
    core.info('AI Test Helper started');

    // TODO: Implement main logic
    // 1. Get API key from inputs
    // 2. Analyze git diff
    // 3. Generate test suggestions
    // 4. Generate test code

    core.info('AI Test Helper completed');
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('An unexpected error occurred');
    }
  }
}

run();
