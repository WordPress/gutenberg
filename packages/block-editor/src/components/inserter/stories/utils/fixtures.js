export const patterns = [
	{
		categories: [ 'featured', 'text' ],
		content:
			'<!-- wp:heading {"align":"wide","style":{"typography":{"fontSize":"48px","lineHeight":"1.1"}}} -->\n<h2 class="alignwide" id="we-re-a-studio-in-berlin-with-an-international-practice-in-architecture-urban-planning-and-interior-design-we-believe-in-sharing-knowledge-and-promoting-dialogue-to-increase-the-creative-potential-of-collaboration" style="font-size:48px;line-height:1.1">We\'re a studio in Berlin with an international practice in architecture, urban planning and interior design. We believe in sharing knowledge and promoting dialogue to increase the creative potential of collaboration.</h2>\n<!-- /wp:heading -->',
		description: 'Heading text',
		keywords: [ 'large text', 'title' ],
		name: 'heading',
		title: 'Heading',
	},
];

export const patternCategories = [
	{
		name: 'featured',
		label: 'Featured',
	},
	{
		name: 'text',
		label: 'Text',
	},
];

export const reusableBlocks = [
	{
		content: {
			raw: '\x3C!-- wp:paragraph -->\n<p>This is reusable</p>\n\x3C!-- /wp:paragraph -->',
			protected: false,
			block_version: 1,
		},
		date: '2022-09-12T13:28:06',
		date_gmt: '2022-09-12T13:28:06',
		id: 70,
		link: 'http://localhost:8888/?p=70',
		modified: '2022-09-12T13:28:06',
		modified_gmt: '2022-09-12T13:28:06',
		password: '',
		slug: 'simple-paragraph',
		status: 'publish',
		template: '',
		title: { raw: 'Simple paragraph' },
		type: 'wp_block',
	},
];
