const generateWordpressPlaygroundBlueprint = ( prNumber ) => ( {
	landingPage: '/wp-admin/',
	steps: [
		{
			step: 'login',
			username: 'admin',
			password: 'password',
		},
		{
			step: 'mkdir',
			path: '/wordpress/pr',
		},
		{
			step: 'writeFile',
			path: '/wordpress/pr/pr.zip',
			data: {
				resource: 'url',
				url: `/plugin-proxy.php?org=WordPress&repo=gutenberg&workflow=Build%20Gutenberg%20Plugin%20Zip&artifact=gutenberg-plugin&pr=${ prNumber }`,
				caption: `Downloading Gutenberg PR ${ prNumber }`,
			},
			progress: {
				weight: 2,
				caption: `Applying Gutenberg PR ${ prNumber }`,
			},
		},
		{
			step: 'unzip',
			zipPath: '/wordpress/pr/pr.zip',
			extractToPath: '/wordpress/pr',
		},
		{
			step: 'installPlugin',
			pluginZipFile: {
				resource: 'vfs',
				path: '/wordpress/pr/gutenberg.zip',
			},
		},
	],
} );

module.exports.run = async function run( { github, context } ) {
	const commentInfo = {
		owner: context.repo.owner,
		repo: context.repo.repo,
		issue_number: context.issue.number,
	};

	const comments = ( await github.rest.issues.listComments( commentInfo ) )
		.data;
	let foundComment = false;

	for ( const currentComment of comments ) {
		if (
			currentComment.user.type === 'Bot' &&
			currentComment.body.includes(
				'Test this PR in the WordPress Playground'
			)
		) {
			foundComment = true;
			break;
		}
	}

	const defaultSchema = generateWordpressPlaygroundBlueprint(
		context.issue.number
	);
	const encodedJson = encodeURI( JSON.stringify( defaultSchema ) );
	const url = `https://playground.wordpress.net/#${ encodedJson }`;

	const body = `[Test this PR in the WordPress Playground](${ url }) ([learn more](https://playground.wordpress.net/playground/)).`;

	if ( ! foundComment ) {
		commentInfo.body = body;
		await github.rest.issues.createComment( commentInfo );
	}
};
