module.exports = {
	docs: [
		{
			type: 'category',
			label: 'Overview',
			items: [
				'readme',
				{
					type: 'category',
					label: 'Architecture',
					items: [
						'architecture/readme',
						'architecture/folder-structure',
						'architecture/modularity',
						'architecture/performance',
						'architecture/automated-testing',
					],
				},
			],
		},
	],
	tutorials: [
		'designers-developers/developers/tutorials/readme',
		{
			type: 'category',
			label: 'JavaScript',
			items: [
				'designers-developers/developers/tutorials/javascript/readme',
				'designers-developers/developers/tutorials/javascript/loading-javascript',
				'designers-developers/developers/tutorials/javascript/extending-the-block-editor',
				'designers-developers/developers/tutorials/javascript/troubleshooting',
				'designers-developers/developers/tutorials/javascript/versions-and-building',
				'designers-developers/developers/tutorials/javascript/scope-your-code',
				'designers-developers/developers/tutorials/javascript/js-build-setup',
				'designers-developers/developers/tutorials/javascript/esnext-js',
			],
		},
		{
			type: 'category',
			label: 'Create Block',
			items: [
				'designers-developers/developers/tutorials/create-block/readme',
				'designers-developers/developers/tutorials/create-block/wp-plugin',
				'designers-developers/developers/tutorials/create-block/block-anatomy',
				'designers-developers/developers/tutorials/create-block/block-attributes',
				'designers-developers/developers/tutorials/create-block/block-code',
				'designers-developers/developers/tutorials/create-block/author-experience',
				'designers-developers/developers/tutorials/create-block/finishing',
			],
		},
	],
};
