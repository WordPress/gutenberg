/**
 * External dependencies
 */
import type { TestCaseResult } from '@jest/test-result';
import type { TestResult } from '@playwright/test/reporter';

type BaseFlakyTestResult = {
	version: number;
	title: string;
	path: string;
};

type JestCircusFlakyTestResult = BaseFlakyTestResult & {
	runner: 'jest-circus';
	results: TestCaseResult[];
};

type PlaywrightTestFlakyTestResult = BaseFlakyTestResult & {
	runner: '@playwright/test';
	results: TestResult[];
};

export type FlakyTestResult =
	| JestCircusFlakyTestResult
	| PlaywrightTestFlakyTestResult;

export type MetaData = {
	failedTimes?: number;
	totalCommits?: number;
	baseCommit?: string;
};

export type ReportedIssue = {
	testTitle: string;
	testPath: string;
	issueNumber: number;
	issueUrl: string;
};
