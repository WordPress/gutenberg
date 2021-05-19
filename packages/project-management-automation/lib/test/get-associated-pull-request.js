/**
 * Internal dependencies
 */
import getAssociatedPullRequest from '../get-associated-pull-request';

/** @typedef {import('../get-associated-pull-request').WebhookPayloadPushCommit} WebhookPayloadPushCommit */

/**
 * An example commit which can be associated with a pull request, e.g. a pull
 * request merge commit.
 *
 * @type {WebhookPayloadPushCommit}
 */
const VALID_COMMIT = {
	message:
		'Components: SlotFill: Guard property access to possibly-undefined slot (#21205)',
};

/**
 * An example commit which cannot be associated with a pull request, e.g. when
 * someone commits directly to trunk.
 *
 * @type {WebhookPayloadPushCommit}
 */
const INVALID_COMMIT = {
	message: 'Add basic placeholder content to post title, content, and date.',
};

describe( 'getAssociatedPullRequest', () => {
	it( 'should return the pull request number associated with a commit', () => {
		expect( getAssociatedPullRequest( VALID_COMMIT ) ).toBe( 21205 );
	} );

	it( 'should return null if a pull request cannot be determined', () => {
		expect( getAssociatedPullRequest( INVALID_COMMIT ) ).toBeNull();
	} );
} );
