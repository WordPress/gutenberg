export default [
	{
		name: 'test/banner-project-description',
		title: 'Project description',
		description:
			'Project description section with title, paragraph, and an image.',
		viewportWidth: 1400,
		categories: [ 'featured', 'banner', 'about', 'portfolio' ],
		blocks: [
			{
				clientId: '8908d110-df74-4452-b0f0-0b16de7592de',
				name: 'core/group',
				isValid: true,
				attributes: {
					tagName: 'div',
					align: 'full',
					style: {
						spacing: {
							margin: {
								top: '0',
								bottom: '0',
							},
							padding: {
								top: 'var:preset|spacing|50',
								bottom: 'var:preset|spacing|50',
								left: 'var:preset|spacing|50',
								right: 'var:preset|spacing|50',
							},
						},
					},
					backgroundColor: 'accent-2',
					layout: {
						type: 'constrained',
					},
					metadata: {
						categories: [
							'featured',
							'banner',
							'about',
							'portfolio',
						],
						patternName: 'test/banner-project-description',
						name: 'Project description',
					},
				},
				innerBlocks: [
					{
						clientId: '33abb7bd-faff-4110-ab47-18701c985088',
						name: 'core/columns',
						isValid: true,
						attributes: {
							isStackedOnMobile: true,
							align: 'wide',
						},
						innerBlocks: [
							{
								clientId:
									'e9abee7b-580d-4524-b466-07df71df1fc8',
								name: 'core/column',
								isValid: true,
								attributes: {
									width: '40%',
								},
								innerBlocks: [
									{
										clientId:
											'849d3177-30af-4670-83bb-4d3577ea6aaf',
										name: 'core/paragraph',
										isValid: true,
										attributes: {
											content: 'Art Gallery — Overview',
											dropCap: false,
											style: {
												layout: {
													selfStretch: 'fixed',
													flexSize: '50%',
												},
											},
										},
										innerBlocks: [],
										originalContent:
											'<p>Art Gallery — Overview</p>',
										validationIssues: [],
									},
								],
								originalContent:
									'<div class="wp-block-column" style="flex-basis:40%">\n\t\t\t\n\t\t</div>',
								validationIssues: [],
							},
							{
								clientId:
									'35846951-b903-4b60-b9f1-fbdb8327b9ef',
								name: 'core/column',
								isValid: true,
								attributes: {
									width: '60%',
								},
								innerBlocks: [
									{
										clientId:
											'c590c595-1e20-45db-b7e1-3366e868fab5',
										name: 'core/paragraph',
										isValid: true,
										attributes: {
											content:
												"This transformative project seeks to enhance the gallery's infrastructure, accessibility, and exhibition spaces while preserving its rich cultural heritage.",
											dropCap: false,
											style: {
												typography: {
													lineHeight: '1.2',
												},
											},
											fontSize: 'x-large',
											fontFamily: 'heading',
										},
										innerBlocks: [],
										originalContent:
											'<p class="has-heading-font-family has-x-large-font-size" style="line-height:1.2">This transformative project seeks to enhance the gallery&#039;s infrastructure, accessibility, and exhibition spaces while preserving its rich cultural heritage.</p>',
										validationIssues: [],
									},
								],
								originalContent:
									'<div class="wp-block-column" style="flex-basis:60%">\n\n\t\t\t\n\n\t\t</div>',
								validationIssues: [],
							},
						],
						originalContent:
							'<div class="wp-block-columns alignwide">\n\t\t\n\n\t\t\n\t</div>',
						validationIssues: [],
					},
					{
						clientId: 'cba31ae8-b732-4bf7-bbf3-83f2cf614537',
						name: 'core/spacer',
						isValid: true,
						attributes: {
							height: 'var:preset|spacing|40',
						},
						innerBlocks: [],
						originalContent:
							'<div style="height:var(--wp--preset--spacing--40)" aria-hidden="true" class="wp-block-spacer">\n\t</div>',
						validationIssues: [],
					},
					{
						clientId: 'e08c7f38-fca0-44a8-91ce-c22c86e90203',
						name: 'core/image',
						isValid: true,
						attributes: {
							url: 'https://live.staticflickr.com/5725/21726228300_51333bd62c_b.jpg',
							alt: 'moon',
							caption: '',
							sizeSlug: 'large',
							linkDestination: 'none',
							align: 'wide',
							className: 'is-style-rounded',
						},
						innerBlocks: [],
						originalContent:
							'<figure class="wp-block-image alignwide size-large is-style-rounded">\n\t\t<img src="https://live.staticflickr.com/5725/21726228300_51333bd62c_b.jpg" alt="moon" />\n\t</figure>',
						validationIssues: [],
					},
				],
			},
		],
	},
	{
		name: 'test/text-alternating-images',
		title: 'Text with alternating images',
		description:
			'A text section, then a two column section with text in one and image in another.',
		viewportWidth: 1400,
		categories: [ 'text', 'about' ],
		blocks: [
			{
				clientId: '80c7a7ae-54da-4eec-9e4c-078b9d49483d',
				name: 'core/group',
				isValid: true,
				attributes: {
					tagName: 'div',
					align: 'full',
					style: {
						spacing: {
							padding: {
								top: 'var:preset|spacing|50',
								bottom: 'var:preset|spacing|50',
								left: 'var:preset|spacing|50',
								right: 'var:preset|spacing|50',
							},
							margin: {
								top: '0',
								bottom: '0',
							},
						},
					},
					layout: {
						type: 'constrained',
					},
					metadata: {
						categories: [ 'text', 'about' ],
						patternName: 'test/text-alternating-images',
						name: 'Text with alternating images',
					},
				},
				innerBlocks: [
					{
						clientId: 'f4c96ce6-e898-4402-b045-3ba7e13e86e2',
						name: 'core/group',
						isValid: true,
						attributes: {
							tagName: 'div',
							align: 'wide',
							style: {
								spacing: {
									blockGap: '0',
								},
							},
							layout: {
								type: 'constrained',
							},
						},
						innerBlocks: [
							{
								clientId:
									'db1fa795-87aa-46d0-8aba-70095da8b727',
								name: 'core/group',
								isValid: true,
								attributes: {
									tagName: 'div',
									style: {
										spacing: {
											blockGap: 'var:preset|spacing|10',
										},
									},
									layout: {
										type: 'flex',
										orientation: 'vertical',
										justifyContent: 'center',
									},
								},
								innerBlocks: [
									{
										clientId:
											'07ed581a-58eb-4562-a6d0-47f731d5343f',
										name: 'core/heading',
										isValid: true,
										attributes: {
											textAlign: 'center',
											content: 'An array of resources',
											level: 2,
											className: 'is-style-asterisk',
										},
										innerBlocks: [],
										originalContent:
											'<h2 class="wp-block-heading has-text-align-center is-style-asterisk">An array of resources</h2>',
										validationIssues: [],
									},
									{
										clientId:
											'b5112868-5241-4eb3-9360-66e89ed1539e',
										name: 'core/paragraph',
										isValid: true,
										attributes: {
											align: 'center',
											content:
												'Our comprehensive suite of professional services caters to a diverse clientele, ranging from homeowners to commercial developers.',
											dropCap: false,
											style: {
												layout: {
													selfStretch: 'fit',
													flexSize: null,
												},
											},
										},
										innerBlocks: [],
										originalContent:
											'<p class="has-text-align-center">Our comprehensive suite of professional services caters to a diverse clientele, ranging from homeowners to commercial developers.</p>',
										validationIssues: [],
									},
								],
								originalContent:
									'<div class="wp-block-group">\n\n\t\t\t\n\n\t\t\t\n\t\t</div>',
								validationIssues: [],
							},
							{
								clientId:
									'e0aba5af-a739-4038-871b-67eb61c75357',
								name: 'core/spacer',
								isValid: true,
								attributes: {
									height: 'var:preset|spacing|40',
								},
								innerBlocks: [],
								originalContent:
									'<div style="height:var(--wp--preset--spacing--40)" aria-hidden="true" class="wp-block-spacer"></div>',
								validationIssues: [],
							},
							{
								clientId:
									'63886283-67ac-4056-8749-21852e89db6e',
								name: 'core/columns',
								isValid: true,
								attributes: {
									isStackedOnMobile: true,
									align: 'wide',
									style: {
										spacing: {
											blockGap: {
												top: 'var:preset|spacing|50',
												left: 'var:preset|spacing|60',
											},
										},
									},
								},
								innerBlocks: [
									{
										clientId:
											'e3030cf0-07b3-44be-a995-387f336fee3b',
										name: 'core/column',
										isValid: true,
										attributes: {
											verticalAlignment: 'center',
											width: '40%',
										},
										innerBlocks: [
											{
												clientId:
													'ddb4e092-24cc-4a65-aa86-c730dce7bbc6',
												name: 'core/heading',
												isValid: true,
												attributes: {
													content:
														'Études Architect App',
													level: 3,
													className:
														'is-style-asterisk',
												},
												innerBlocks: [],
												originalContent:
													'<h3 class="wp-block-heading is-style-asterisk">Études Architect App</h3>',
												validationIssues: [],
											},
											{
												clientId:
													'daa211ee-ea41-4ab0-81f3-1e0434104509',
												name: 'core/list',
												isValid: true,
												attributes: {
													ordered: false,
													values: '',
													className:
														'is-style-checkmark-list',
													style: {
														typography: {
															lineHeight: '1.75',
														},
													},
												},
												innerBlocks: [
													{
														clientId:
															'679ac834-be39-4999-9626-c885ebb2a95c',
														name: 'core/list-item',
														isValid: true,
														attributes: {
															content:
																'Collaborate with fellow architects.',
														},
														innerBlocks: [],
														originalContent:
															'<li>Collaborate with fellow architects.</li>',
														validationIssues: [],
													},
													{
														clientId:
															'a455b595-77a7-4a0f-9d2d-41a21ba613c0',
														name: 'core/list-item',
														isValid: true,
														attributes: {
															content:
																'Showcase your projects.',
														},
														innerBlocks: [],
														originalContent:
															'<li>Showcase your projects.</li>',
														validationIssues: [],
													},
													{
														clientId:
															'4697cd69-b038-43d0-bec9-d72128cce349',
														name: 'core/list-item',
														isValid: true,
														attributes: {
															content:
																'Experience the world of architecture.',
														},
														innerBlocks: [],
														originalContent:
															'<li>Experience the world of architecture.</li>',
														validationIssues: [],
													},
												],
												originalContent:
													'<ul class="is-style-checkmark-list" style="line-height:1.75">\n\n\t\t\t\t\t\n\n\t\t\t\t\t\n\n\t\t\t\t\t\n\n\t\t\t\t</ul>',
												validationIssues: [],
											},
										],
										originalContent:
											'<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:40%">\n\t\t\t\t\n\n\t\t\t\t\n\t\t\t</div>',
										validationIssues: [],
									},
									{
										clientId:
											'9d7d644b-a023-4301-acd8-63a686667075',
										name: 'core/column',
										isValid: true,
										attributes: {
											width: '50%',
										},
										innerBlocks: [
											{
												clientId:
													'0d23bf5f-49cd-4c3d-8b47-94b6477d73fc',
												name: 'core/image',
												isValid: true,
												attributes: {
													url: 'https://live.staticflickr.com/5725/21726228300_51333bd62c_b.jpg',
													alt: 'space',
													caption: '',
													sizeSlug: 'large',
													linkDestination: 'none',
													className:
														'is-style-rounded',
												},
												innerBlocks: [],
												originalContent:
													'<figure class="wp-block-image size-large is-style-rounded">\n\t\t\t\t\t<img src="https://live.staticflickr.com/5725/21726228300_51333bd62c_b.jpg" alt="Jupiter" />\n\t\t\t\t</figure>',
												validationIssues: [],
											},
										],
										originalContent:
											'<div class="wp-block-column" style="flex-basis:50%">\n\t\t\t\t\n\t\t\t</div>',
										validationIssues: [],
									},
								],
								originalContent:
									'<div class="wp-block-columns alignwide">\n\t\t\t\n\n\t\t\t\n\t\t</div>',
								validationIssues: [],
							},
							{
								clientId:
									'66573fb0-cc2d-456d-a6d4-05fe08e2d53c',
								name: 'core/spacer',
								isValid: true,
								attributes: {
									height: 'var:preset|spacing|40',
								},
								innerBlocks: [],
								originalContent:
									'<div style="height:var(--wp--preset--spacing--40)" aria-hidden="true" class="wp-block-spacer"></div>',
								validationIssues: [],
							},
							{
								clientId:
									'5a2dc829-8a33-410d-b65b-ea74afc1829f',
								name: 'core/columns',
								isValid: true,
								attributes: {
									isStackedOnMobile: true,
									align: 'wide',
									style: {
										spacing: {
											blockGap: {
												top: 'var:preset|spacing|50',
												left: 'var:preset|spacing|60',
											},
										},
									},
								},
								innerBlocks: [
									{
										clientId:
											'8fe82ceb-f19b-4bdb-aad7-a03b3e74c087',
										name: 'core/column',
										isValid: true,
										attributes: {
											width: '50%',
										},
										innerBlocks: [
											{
												clientId:
													'b03908e1-615e-4bd3-9a02-dbb6cdae4d2d',
												name: 'core/image',
												isValid: true,
												attributes: {
													url: 'https://live.staticflickr.com/5725/21726228300_51333bd62c_b.jpg',
													alt: 'space',
													caption: '',
													sizeSlug: 'large',
													linkDestination: 'none',
													className:
														'is-style-rounded',
												},
												innerBlocks: [],
												originalContent:
													'<figure class="wp-block-image size-large is-style-rounded">\n\t\t\t\t\t<img src="https://live.staticflickr.com/5725/21726228300_51333bd62c_b.jpg" alt="https://live.staticflickr.com/5725/21726228300_51333bd62c_b.jpg" />\n\t\t\t\t</figure>',
												validationIssues: [],
											},
										],
										originalContent:
											'<div class="wp-block-column" style="flex-basis:50%">\n\t\t\t\t\n\t\t\t</div>',
										validationIssues: [],
									},
									{
										clientId:
											'a4338102-c9b6-4b44-b2fb-92264108c28c',
										name: 'core/column',
										isValid: true,
										attributes: {
											verticalAlignment: 'center',
											width: '40%',
										},
										innerBlocks: [
											{
												clientId:
													'1afd08a2-d11a-46ed-8aeb-1e85276d0763',
												name: 'core/heading',
												isValid: true,
												attributes: {
													content:
														'Études Newsletter',
													level: 3,
													className:
														'is-style-asterisk',
												},
												innerBlocks: [],
												originalContent:
													'<h3 class="wp-block-heading is-style-asterisk">Études Newsletter</h3>',
												validationIssues: [],
											},
											{
												clientId:
													'8c0c7511-5b90-4642-94e3-d0647b38edd6',
												name: 'core/list',
												isValid: true,
												attributes: {
													ordered: false,
													values: '',
													className:
														'is-style-checkmark-list',
													style: {
														typography: {
															lineHeight: '1.75',
														},
													},
												},
												innerBlocks: [
													{
														clientId:
															'63a49e05-ac40-4dd2-a395-aabfb1311836',
														name: 'core/list-item',
														isValid: true,
														attributes: {
															content:
																'A world of thought-provoking articles.',
														},
														innerBlocks: [],
														originalContent:
															'<li>A world of thought-provoking articles.</li>',
														validationIssues: [],
													},
													{
														clientId:
															'341c1d5d-e9f7-40cb-8d7e-17577d2271c3',
														name: 'core/list-item',
														isValid: true,
														attributes: {
															content:
																'Case studies that celebrate architecture.',
														},
														innerBlocks: [],
														originalContent:
															'<li>Case studies that celebrate architecture.</li>',
														validationIssues: [],
													},
													{
														clientId:
															'9bbe629f-c214-49cb-82a2-7574e9f72fa2',
														name: 'core/list-item',
														isValid: true,
														attributes: {
															content:
																'Exclusive access to design insights.',
														},
														innerBlocks: [],
														originalContent:
															'<li>Exclusive access to design insights.</li>',
														validationIssues: [],
													},
												],
												originalContent:
													'<ul class="is-style-checkmark-list" style="line-height:1.75">\n\t\t\t\t\t\n\n\t\t\t\t\t\n\n\t\t\t\t\t\n\t\t\t\t</ul>',
												validationIssues: [],
											},
										],
										originalContent:
											'<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:40%">\n\t\t\t\t\n\n\t\t\t\t\n\t\t\t</div>',
										validationIssues: [],
									},
								],
								originalContent:
									'<div class="wp-block-columns alignwide">\n\t\t\t\n\n\t\t\t\n\t\t</div>',
								validationIssues: [],
							},
						],
						originalContent:
							'<div class="wp-block-group alignwide">\n\t\t\n\n\t\t\n\n\t\t\n\n\t\t\n\n\t\t\n\t</div>',
						validationIssues: [],
					},
				],
			},
		],
	},
	{
		name: 'test/text-centered-statement-small',
		title: 'Centered statement, small',
		description: 'A centered itallic text statement with compact padding.',
		viewportWidth: 1200,
		categories: [ 'text', 'about' ],
		keywords: [ 'mission', 'introduction' ],
		blocks: [
			{
				clientId: '1f192524-7eb6-45eb-a707-a67941529eb8',
				name: 'core/group',
				isValid: true,
				attributes: {
					tagName: 'div',
					align: 'full',
					style: {
						spacing: {
							padding: {
								top: 'var:preset|spacing|50',
								bottom: 'var:preset|spacing|50',
								left: 'var:preset|spacing|50',
								right: 'var:preset|spacing|50',
							},
							margin: {
								top: '0',
								bottom: '0',
							},
						},
					},
					layout: {
						type: 'constrained',
						contentSize: '800px',
					},
					metadata: {
						categories: [ 'text', 'about' ],
						patternName: 'test/text-centered-statement-small',
						name: 'Centered statement, small',
					},
				},
				innerBlocks: [
					{
						clientId: '7dcff556-4dc7-4e6f-968a-9c7cada32b52',
						name: 'core/heading',
						isValid: true,
						attributes: {
							textAlign: 'center',
							content:
								'\n\t\t<em>\n\t\tI write about finance, management and economy, my book “<a href="#" rel="nofollow">Money Studies</a>” is out now.\t\t</em>\n\t',
							level: 1,
							fontSize: 'x-large',
						},
						innerBlocks: [],
						originalContent:
							'<h1 class="wp-block-heading has-text-align-center has-x-large-font-size">\n\t\t<em>\n\t\tI write about finance, management and economy, my book “<a href="#" rel="nofollow">Money Studies</a>” is out now.\t\t</em>\n\t</h1>',
						validationIssues: [],
					},
				],
				originalContent:
					'<div class="wp-block-group alignfull" style="margin-top:0;margin-bottom:0;padding-top:var(--wp--preset--spacing--50);padding-right:var(--wp--preset--spacing--50);padding-bottom:var(--wp--preset--spacing--50);padding-left:var(--wp--preset--spacing--50)">\n\n\t\n</div>',
				validationIssues: [],
			},
		],
	},
	{
		name: 'twentytwentyfour/text-centered-statement',
		title: 'Centered statement',
		description: 'A centered text statement with a large paddings.',
		viewportWidth: 1400,
		categories: [ 'text', 'about', 'featured' ],
		keywords: [ 'mission', 'introduction' ],
		blocks: [
			{
				clientId: '842252dc-2d86-43ca-87bc-25c70ea541f3',
				name: 'core/group',
				isValid: true,
				attributes: {
					tagName: 'div',
					align: 'full',
					style: {
						spacing: {
							padding: {
								top: 'var:preset|spacing|60',
								bottom: 'var:preset|spacing|60',
								left: 'var:preset|spacing|60',
								right: 'var:preset|spacing|60',
							},
							margin: {
								top: '0',
								bottom: '0',
							},
						},
					},
					backgroundColor: 'base-2',
					layout: {
						type: 'constrained',
					},
					metadata: {
						categories: [ 'about' ],
						patternName: 'twentytwentyfour/text-centered-statement',
						name: 'Centered statement',
					},
				},
				innerBlocks: [
					{
						clientId: '06211054-fccb-4685-b2c2-40ca97162c41',
						name: 'core/group',
						isValid: true,
						attributes: {
							tagName: 'div',
							align: 'wide',
							layout: {
								type: 'default',
							},
						},
						innerBlocks: [
							{
								clientId:
									'c60e114b-153b-4df9-bbea-98512b1c84a8',
								name: 'core/spacer',
								isValid: true,
								attributes: {
									height: 'var:preset|spacing|50',
								},
								innerBlocks: [],
								originalContent:
									'<div style="height:var(--wp--preset--spacing--50)" aria-hidden="true" class="wp-block-spacer"></div>',
								validationIssues: [],
							},
							{
								clientId:
									'a2a2b48d-20ce-48ba-b936-140f56b8c00e',
								name: 'core/paragraph',
								isValid: true,
								attributes: {
									align: 'center',
									content:
										'<em>Études</em> is not confined to the past—we are passionate about the cutting edge designs shaping our world today.',
									dropCap: false,
									style: {
										typography: {
											lineHeight: '1.2',
											fontStyle: 'normal',
											fontWeight: '400',
										},
									},
									fontSize: 'x-large',
									fontFamily: 'heading',
								},
								innerBlocks: [],
								originalContent:
									'<p class="has-text-align-center has-heading-font-family has-x-large-font-size" style="font-style:normal;font-weight:400;line-height:1.2"><em>Études</em> is not confined to the past—we are passionate about the cutting edge designs shaping our world today.</p>',
								validationIssues: [],
							},
							{
								clientId:
									'c5264379-1da7-4b88-a00f-9eda8e80c6f4',
								name: 'core/spacer',
								isValid: true,
								attributes: {
									height: 'var:preset|spacing|50',
								},
								innerBlocks: [],
								originalContent:
									'<div style="height:var(--wp--preset--spacing--50)" aria-hidden="true" class="wp-block-spacer"></div>',
								validationIssues: [],
							},
						],
						originalContent:
							'<div class="wp-block-group alignwide">\n\t\t\n\n\t\t\n\n\t\t\n\t</div>',
						validationIssues: [],
					},
				],
				originalContent:
					'<div class="wp-block-group alignfull has-base-2-background-color has-background" style="margin-top:0;margin-bottom:0;padding-top:var(--wp--preset--spacing--60);padding-right:var(--wp--preset--spacing--60);padding-bottom:var(--wp--preset--spacing--60);padding-left:var(--wp--preset--spacing--60)">\n\t\n</div>',
				validationIssues: [],
			},
		],
	},
];
