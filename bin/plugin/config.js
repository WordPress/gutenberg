const gitRepoOwner = 'WordPress';

const config = {
	slug: 'gutenberg',
	name: 'Gutenberg',
	team: 'Gutenberg Core',
	githubRepositoryOwner: gitRepoOwner,
	githubRepositoryName: 'gutenberg',
	pluginEntryPoint: 'gutenberg.php',
	buildZipCommand: '/bin/bash bin/build-plugin-zip.sh',
	wpRepositoryReleasesURL:
		'https://github.com/WordPress/gutenberg/releases/tag/',
	gitRepositoryURL: 'https://github.com/' + gitRepoOwner + '/gutenberg.git',
	svnRepositoryURL: 'https://plugins.svn.wordpress.org/gutenberg',
};

module.exports = config;
