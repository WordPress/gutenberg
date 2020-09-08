/**
 * External dependencies
 */
const { join, dirname } = require( 'path' );
const micromatch = require( 'micromatch' );

/**
 * Internal dependencies
 */
const debug = require( '../../debug' );

/** @typedef {import('@actions/github').GitHub} GitHub */
/** @typedef {import('@octokit/webhooks').WebhookPayloadPullRequest} WebhookPayloadPullRequest */

const WARNING_MESSAGE =
	'It appears that this pull request is modifying the generated saved ' +
	'markup of a core block, but does not include an accompanying ' +
	'deprecation. It is typically expected that a deprecation should be ' +
	'implemented, as otherwise it could cause existing content to become ' +
	"invalid.\n\nIf you've already taken remediation steps or a deprecation " +
	'should not apply, you can safely ignore this message.\n\n[See this ' +
	" automation's documentation](https://github.com/WordPress/gutenberg/blob/master/packages/project-management-automation/lib/tasks/block-deprecation-warning/README.md) " +
	'for more information, including references to related resources.';

/**
 * Returns true if the given set of pull request files should be considered a
 * violation of the block deprecation criteria, or false otherwise.
 *
 * @param {string[]} filenames Pull request filenames.
 *
 * @return {boolean} Whether files are violation.
 */
function isDeprecationViolation( filenames ) {
	const saves = micromatch( filenames, 'packages/block-library/**/save.js' );
	return saves.some( ( save ) => {
		const deprecated = join( dirname( save ), 'deprecated.js' );
		return ! filenames.includes( deprecated );
	} );
}

/**
 * Assigns any issues 'fixed' by a newly opened PR to the author of that PR.
 *
 * @param {WebhookPayloadPullRequest} payload Pull request event payload.
 * @param {GitHub}                    octokit Initialized Octokit REST client.
 */
async function blockDeprecationWarning( payload, octokit ) {
	const { number, repository } = payload;

	const { data: files } = await octokit.pulls.listFiles( {
		owner: repository.owner.login,
		repo: repository.name,
		pull_number: number,
	} );
	const filenames = files.map( ( file ) => file.filename );

	const isViolation = isDeprecationViolation( filenames );
	if ( isViolation ) {
		debug( 'block-deprecation-warning: Violation found! Adding comment.' );

		await octokit.issues.createComment( {
			owner: repository.owner.login,
			repo: repository.name,
			issue_number: number,
			body: WARNING_MESSAGE,
		} );
	} else {
		debug( `block-deprecation-warning: No violation found.` );
	}
}

module.exports = blockDeprecationWarning;
