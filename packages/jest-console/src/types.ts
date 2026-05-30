/**
 * External dependencies
 */
import type { Mock } from 'jest-mock';

/**
 * Interface for the extended Jest Mock that includes the assertionsNumber property
 */
export interface ExtendedMock extends Mock {
	assertionsNumber: number;
}

/**
 * Interface for the matcher result object
 */
export interface MatcherResult {
	pass: boolean;
	message: () => string;
}

/**
 * Interface for the matcher function
 */
export type MatcherFunction = (
	received: Record< string, Mock >
) => MatcherResult;

/**
 * Interface for the matcher function with arguments
 */
export type MatcherWithArgsFunction = (
	received: Record< string, Mock >,
	...expected: unknown[]
) => MatcherResult;
