const gitRepoOwner = 'WordPress';

/**
 * @typedef WPPluginCLIConfig
 *
 * @property {string} slug                    Slug.
 * @property {string} name                    Name.
 * @property {string} team                    GitHub Team Name.
 * @property {string} versionMilestoneFormat  printf template for milestone
 *                                            version name. Expected to be called
 *                                            with a merged object of the config
 *                                            and semver-parsed version parts.
 * @property {string} githubRepositoryOwner   GitHub Repository Owner.
 * @property {string} githubRepositoryName    GitHub Repository Name.
 * @property {string} pluginEntryPoint        Plugin Entry Point File.
 * @property {string} buildZipCommand         Build Plugin ZIP command.
 * @property {string} githubRepositoryURL     GitHub Repository URL.
 * @property {string} wpRepositoryReleasesURL WordPress Repository Tags URL.
 * @property {string} gitRepositoryURL        Git Repository URL.
 * @property {string} svnRepositoryURL        SVN Repository URL.
 */

/**
 * @type {WPPluginCLIConfig}
 */
const config = {
	slug: 'gutenberg',
	name: 'Gutenberg',
	team: 'Gutenberg Core',
	versionMilestoneFormat: '%(name)s %(major)s.%(minor)s',
	githubRepositoryOwner: gitRepoOwner,
	githubRepositoryName: 'gutenberg',
	pluginEntryPoint: 'gutenberg.php',
	buildZipCommand: '/bin/bash bin/build-plugin-zip.sh',
	githubRepositoryURL: 'https://github.com/' + gitRepoOwner + '/gutenberg/',
	wpRepositoryReleasesURL: 'https://github.com/WordPress/gutenberg/releases/',
	gitRepositoryURL: 'https://github.com/' + gitRepoOwner + '/gutenberg.git',
	svnRepositoryURL: 'https://plugins.svn.wordpress.org/gutenberg',
};

module.exports = config;
