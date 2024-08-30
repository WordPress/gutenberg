/**
 * Based on:
 * https://github.com/Automattic/themes/blob/a0c9b91f827f46ed60c502d41ef881b2f0552f03/.github/scripts/create-preview-links.js
 */

/*
 * This function creates the URL where to download the built & zipped plugin.
 *
 * @param {object} context - The context of the event that triggered the action.
 * @param {number} number - The PR number where the plugin changes are located.
 * @returns {string} - The URL where to download the built & zipped plugin, as an artifact of the workflow.
 */
function createBlueprintUrl( context, number ) {
	const { repo, owner } = context;
	const workflow = encodeURI( 'Build Gutenberg Plugin Zip' );
	const artifact = 'gutenberg-plugin-pr';
	const proxy = '/plugin-proxy.php';

	return `${ proxy }/?org=${ owner }&repo=${ repo }&workflow=${ workflow }&artifact=${ artifact }&pr=${ number }`;
}

/*
 * This function creates a WordPress Playground blueprint JSON string for a given PR of the Gutenberg plugin.
 *
 * @param {object} context - The context of the event that triggered the action.
 * @param {number} number - The PR number where the plugin changes are located.
 * @param {string} zipArtifactUrl - The URL where to download the built & zipped plugin, as an artifact of the workflow.
 * @returns {string} - A JSON string representing the steps of a blueprint.
 */
function createBlueprint( context, number, zipArtifactUrl ) {
	const { repo, owner } = context;

	// TODO
	// Verify that the PR exists and that GitHub CI finished building it
	// ...

	const template = {
		landingPage: '/wp-admin/post-new.php?post_type=post',
		preferredVersions: {
			php: '8.3',
			wp: 'latest',
		},
		phpExtensionBundles: [ 'kitchen-sink' ],
		features: {
			networking: true,
		},
		steps: [
			{
				step: 'enableMultisite',
			},
			{
				step: 'login',
				username: 'admin',
				password: 'password',
			},
			{
				step: 'setSiteOptions',
				options: {
					blogname: `${ owner }/${ repo } PR #${ number }`,
					blogdescription: `Testing pull_request #${ number } with Playground`,
				},
			},
			{
				step: 'mkdir',
				path: '/wordpress/pr',
			},
			/*
			 * This is the most important step.
			 * It download the built plugin zip file exposed by GitHub CI.
			 *
			 * Because the zip file is not publicly accessible, we use the
			 * plugin-proxy API endpoint to download it. The source code of
			 * that endpoint is available at:
			 * https://github.com/WordPress/wordpress-playground/blob/trunk/packages/playground/website/public/plugin-proxy.php
			 */
			{
				step: 'writeFile',
				path: '/wordpress/pr/pr.zip',
				data: {
					resource: 'url',
					url: zipArtifactUrl,
					caption: `Downloading ${ owner }/${ repo } PR #${ number }`,
				},
				progress: {
					weight: 2,
					caption: `Applying ${ owner }/${ repo } PR #${ number }`,
				},
			},
			/**
			 * GitHub CI artifacts are doubly zipped:
			 *
			 * pr.zip
			 *    gutenberg-plugin.zip
			 *       gutenberg/
			 *          gutenberg.php
			 *          ... other files ...
			 *
			 * This step extracts the inner zip file so that we get
			 * access directly to gutenberg.zip and can use it to
			 * install the plugin.
			 */
			{
				step: 'unzip',
				zipPath: '/wordpress/pr/pr.zip',
				extractToPath: '/wordpress/pr',
			},
			{
				step: 'installPlugin',
				pluginZipFile: {
					resource: 'vfs',
					path: '/wordpress/pr/gutenberg-plugin.zip',
				},
			},
		],
	};

	return JSON.stringify( template );
}

/*
 * This function creates a comment on a PR with preview links.
 *
 * It is used by `playground-preview` workflow.
 *
 * @param {object} github - An authenticated instance of the GitHub API.
 * @param {object} context - The context of the event that triggered the action.
 */
async function createPreviewLinksComment( github, context ) {
	const zipArtifactUrl = createBlueprintUrl(
		context.repo,
		context.payload.pull_request.number
	);
	const blueprint = encodeURI(
		createBlueprint(
			context.repo,
			context.payload.pull_request.number,
			zipArtifactUrl
		)
	);
	const prText = `for PR#${ context.payload.pull_request.number }`;
	const playgrounds = [
		{
			name: '**Normal** WordPress playground ' + prText,
			url: 'https://playground.wordpress.net/#',
		},
		{
			name: '**Seamless** WordPress playground ' + prText,
			url: 'https://playground.wordpress.net/?mode=seamless#',
		},
		{
			name: 'WordPress playground **Builder** ' + prText,
			url: 'https://playground.wordpress.net/builder/builder.html#',
		},
	];
	const links = playgrounds.map( ( playground ) => ( {
		title: playground.name,
		url: playground.url + blueprint,
	} ) );
	const previewLinks = links.map(
		( link ) => `- [${ link.title }](${ link.url })\n`
	);
	const title = '### Preview changes with Playground';
	const comment = `
You can preview the least recent changes ${ prText } by following one of the links below:

${ previewLinks.join( ' ' ) }

- [Download <code>.zip</code> with build changes](${ zipArtifactUrl })

**⚠️ Note:** The preview sites are created using [WordPress Playground](https://wordpress.org/playground/). You can add content, edit settings, and test the themes as you would on a real site, but please note that changes are not saved between sessions.
`;

	const repoData = {
		owner: context.repo.owner,
		repo: context.repo.repo,
	};

	// Check if a comment already exists and update it if it does
	const { data: comments } = await github.rest.issues.listComments( {
		issue_number: context.payload.pull_request.number,
		...repoData,
	} );
	const existingComment = comments.find(
		( comment ) =>
			comment.user.login === 'github-actions[bot]' &&
			comment.body.startsWith( title )
	);
	const commentObject = {
		body: `${ title }\n${ comment }`,
		...repoData,
	};

	if ( existingComment ) {
		// Do not update, but delete and recreate Comment to have a new one after last commit.
		await github.rest.issues.deleteComment( {
			comment_id: existingComment.id,
			...commentObject,
		} );
	}

	// Create a new comment if one doesn't exist
	github.rest.issues.createComment( {
		issue_number: context.payload.pull_request.number,
		...commentObject,
	} );
}

module.exports = createPreviewLinksComment;
