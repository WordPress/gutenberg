// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

/**
 * External dependencies
 */
/** @type {import('@docusaurus/types').Config} */
const config = {
	title: 'Gutenberg Block Editor',
	tagline: 'Build block based editors, with HTML and JSON output',
	favicon: 'https://s.w.org/images/wmark.png',

	// Set the production url of your site here
	url: 'https://your-docusaurus-test-site.com',
	// Set the /<baseUrl>/ pathname under which your site is served
	baseUrl: '/',

	onBrokenLinks: 'throw',
	onBrokenMarkdownLinks: 'warn',

	// Even if you don't use internationalization, you can use this field to set useful
	// metadata like html lang. For example, if your site is in Chinese, you may want
	// to replace "en" with "zh-Hans".
	i18n: {
		defaultLocale: 'en',
		locales: [ 'en' ],
	},

	presets: [
		[
			'classic',
			/** @type {import('@docusaurus/preset-classic').Options} */
			( {
				docs: {
					sidebarPath: require.resolve( './sidebars.js' ),
					editUrl:
						'https://github.com/WordPress/gutenberg/tree/trunk/platform-docs/',
				},
				theme: {
					customCss: require.resolve( './src/css/custom.css' ),
				},
			} ),
		],
	],

	plugins: [ require.resolve( 'docusaurus-lunr-search' ) ],

	themeConfig:
		/** @type {import('@docusaurus/preset-classic').ThemeConfig} */
		( {
			// Replace with your project's social card
			image: 'https://s.w.org/images/wmark.png',
			navbar: {
				title: 'Gutenberg Block Editor',
				logo: {
					alt: 'Gutenberg logo',
					src: 'img/logo.svg',
				},
				items: [
					{
						type: 'docSidebar',
						sidebarId: 'tutorialSidebar',
						position: 'left',
						label: 'Docs',
					},
					{
						href: 'https://github.com/WordPress/gutenberg',
						label: 'GitHub',
						position: 'right',
					},
				],
			},
		} ),
};

module.exports = config;
