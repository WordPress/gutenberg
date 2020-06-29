module.exports = {
	title: 'Block Editor Handbook',
	tagline: 'Developer documentation for the WordPress Gutenberg projects',
	url: 'https://your-docusaurus-test-site.com',
	baseUrl: '/',
	favicon: 'img/wp-logo.svg',
	organizationName: 'WordPress', // Usually your GitHub org/user name.
	projectName: 'gutenberg', // Usually your repo name.
	themeConfig: {
		navbar: {
			title: 'Block Editor Handbook',
			logo: {
				alt: 'WordPress',
				src: 'img/wp-logo.svg',
			},
			links: [
				{
					to: 'docs/',
					activeBasePath: 'docs',
					label: 'Docs',
					position: 'left',
				},
				{
					to: 'docs/designers-developers/developers/tutorials/readme',
					activeBasePath: 'docs',
					label: 'Tutorials',
					position: 'left',
				},
				{
					href: 'https://github.com/WordPress/gutenberg',
					label: 'GitHub',
					position: 'right',
				},
			],
		},
		footer: {
			style: 'dark',
			links: [
				{
					title: 'Documentation',
					items: [
						{
							label: 'Project Overview',
							to: 'readme',
						},
						{
							label: 'Tutorials',
							to:
								'docs/designers-developers/developers/tutorials/readme',
						},
					],
				},
				{
					title: 'Community',
					items: [
						{
							label: 'Support',
							href: 'https://wordpress.org/support/',
						},
						{
							label: 'Developers',
							href: 'https://developer.wordpress.org/',
						},
						{
							label: 'Get Involved',
							href: 'https://make.wordpress.org/',
						},
					],
				},
				{
					title: 'More',
					items: [
						{
							label: 'GitHub',
							href: 'https://github.com/facebook/docusaurus',
						},
					],
				},
			],
			copyright: `<img src="https://s.w.org/style/images/codeispoetry-2x.png" alt="Code is Poetry">`,
		},
	},
	presets: [
		[
			'@docusaurus/preset-classic',
			{
				docs: {
					// It is recommended to set document id as docs home page (`docs/` path).
					homePageId: 'readme',
					path: '../docs',
					sidebarPath: require.resolve( './sidebars.js' ),
					hide_title: true,
					editUrl:
						'https://github.com/WordPress/gutenberg/edit/master/docsite/',
				},
				theme: {
					customCss: require.resolve( './src/css/custom.css' ),
					hide_title: true,
				},
				blog: false,
			},
		],
	],
};
