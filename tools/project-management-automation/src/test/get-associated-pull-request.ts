import { describe, expect, it } from 'vitest';
import getAssociatedPullRequest from '../get-associated-pull-request.ts';
import type { WebhookPayloadPushCommit } from '../types.ts';

/**
 * An example commit which can be associated with a pull request, e.g. a pull
 * request merge commit.
 */
const VALID_COMMIT = {
	message:
		'Components: SlotFill: Guard property access to possibly-undefined slot (#21205)',
} as WebhookPayloadPushCommit;

/**
 * An example commit which cannot be associated with a pull request, e.g. when
 * someone commits directly to trunk.
 */
const INVALID_COMMIT = {
	message: 'Add basic placeholder content to post title, content, and date.',
} as WebhookPayloadPushCommit;

describe( 'getAssociatedPullRequest', () => {
	it( 'should return the pull request number associated with a commit', () => {
		expect( getAssociatedPullRequest( VALID_COMMIT ) ).toBe( 21205 );
	} );

	it( 'should return null if a pull request cannot be determined', () => {
		expect( getAssociatedPullRequest( INVALID_COMMIT ) ).toBeNull();
	} );
} );
