export default [
	{
		name: 'test/1',
		title: 'Centered image with two-tone background color',
		blocks: [
			{
				clientId: '035ea9e6-cf5a-4631-a11e-29f3f696f836',
				name: 'core/cover',
				isValid: true,
				attributes: {
					useFeaturedImage: false,
					alt: '',
					hasParallax: false,
					isRepeated: false,
					dimRatio: 100,
					backgroundType: 'image',
					minHeight: 66,
					minHeightUnit: 'vh',
					customGradient:
						'linear-gradient(90deg,rgb(35,74,20) 50%,rgb(225,137,116) 50%)',
					isDark: false,
					tagName: 'div',
					align: 'full',
					style: {
						spacing: {
							padding: {
								top: '5vw',
								right: '5vw',
								bottom: '5vw',
								left: '5vw',
							},
							margin: {
								top: '0',
							},
						},
					},
				},
				innerBlocks: [
					{
						clientId: '57c3e044-137d-456d-8426-20768e07f09f',
						name: 'core/group',
						isValid: true,
						attributes: {
							tagName: 'div',
							style: {
								spacing: {
									blockGap: '0px',
								},
								layout: {
									selfStretch: 'fill',
									flexSize: null,
								},
							},
							layout: {
								type: 'constrained',
								contentSize: '600px',
								wideSize: '1200px',
							},
						},
						innerBlocks: [
							{
								clientId:
									'9e251315-0ea5-4849-9e1a-974de0981f51',
								name: 'core/spacer',
								isValid: true,
								attributes: {
									height: '100px',
								},
								innerBlocks: [],
								originalContent:
									'<div style="height:100px" aria-hidden="true" class="wp-block-spacer"></div>',
								validationIssues: [],
							},
							{
								clientId:
									'd83373a3-bdc3-44d6-9f6f-5a36ef8d637c',
								name: 'core/image',
								isValid: true,
								attributes: {
									url: 'https://pd.w.org/2022/03/3866241b433db4ee2.96648572.jpeg',
									alt: '',
									caption: '',
									sizeSlug: 'large',
									className: 'is-style-default',
									style: {
										color: {
											duotone: [ '#000000', '#ffffff' ],
										},
									},
								},
								innerBlocks: [],
								originalContent:
									'<figure class="wp-block-image size-large is-style-default"><img src="https://pd.w.org/2022/03/3866241b433db4ee2.96648572.jpeg" alt="" /></figure>',
								validationIssues: [],
							},
							{
								clientId:
									'56e72331-1213-466f-bd14-1131a56b2c95',
								name: 'core/spacer',
								isValid: true,
								attributes: {
									height: '48px',
								},
								innerBlocks: [],
								originalContent:
									'<div style="height:48px" aria-hidden="true" class="wp-block-spacer"></div>',
								validationIssues: [],
							},
							{
								clientId:
									'851c15bc-f5cf-4780-838e-6bfea2b09b30',
								name: 'core/heading',
								isValid: true,
								attributes: {
									textAlign: 'center',
									content: 'Etcetera',
									level: 2,
									align: 'wide',
									style: {
										typography: {
											fontSize: '50px',
											fontStyle: 'normal',
											fontWeight: '400',
											textTransform: 'uppercase',
											letterSpacing: '32px',
											lineHeight: '1',
										},
										spacing: {
											padding: {
												left: '32px',
											},
										},
									},
									textColor: 'white',
								},
								innerBlocks: [],
								originalContent:
									'<h2 class="wp-block-heading alignwide has-text-align-center has-white-color has-text-color" style="padding-left:32px;font-size:50px;font-style:normal;font-weight:400;letter-spacing:32px;line-height:1;text-transform:uppercase">Etcetera</h2>',
								validationIssues: [],
							},
							{
								clientId:
									'a734e600-5b98-47c4-982d-c98e8c8b78a2',
								name: 'core/spacer',
								isValid: true,
								attributes: {
									height: '100px',
								},
								innerBlocks: [],
								originalContent:
									'<div style="height:100px" aria-hidden="true" class="wp-block-spacer"></div>',
								validationIssues: [],
							},
						],
						originalContent:
							'<div class="wp-block-group">\n\n\n\n\n\n\n\n</div>',
						validationIssues: [],
					},
				],
				originalContent:
					'<div class="wp-block-cover alignfull is-light" style="margin-top:0;padding-top:5vw;padding-right:5vw;padding-bottom:5vw;padding-left:5vw;min-height:66vh"><span aria-hidden="true" class="wp-block-cover__background has-background-dim-100 has-background-dim has-background-gradient" style="background:linear-gradient(90deg,rgb(35,74,20) 50%,rgb(225,137,116) 50%)"></span><div class="wp-block-cover__inner-container"></div></div>',
				validationIssues: [],
			},
		],
	},
	{
		name: 'test/2',
		title: 'Fullwidth, vertically aligned headline on right with description on left',
		blocks: [
			{
				clientId: 'efa29ce0-cf43-421b-b9e6-46f52f17d943',
				name: 'core/cover',
				isValid: true,
				attributes: {
					alt: '',
					hasParallax: false,
					isRepeated: false,
					dimRatio: 100,
					customOverlayColor: '#e68b14',
					backgroundType: 'image',
					isDark: false,
					useFeaturedImage: false,
					tagName: 'div',
					align: 'full',
					style: {
						spacing: {
							padding: {
								top: '5vw',
								right: '5vw',
								bottom: '5vw',
								left: '5vw',
							},
							margin: {
								top: '0',
							},
						},
					},
					isUserOverlayColor: true,
				},
				innerBlocks: [
					{
						clientId: '4e50914f-9c9c-471a-84ad-4a22b514a393',
						name: 'core/group',
						isValid: true,
						attributes: {
							tagName: 'div',
							layout: {
								type: 'flex',
								flexWrap: 'wrap',
								verticalAlignment: 'top',
							},
						},
						innerBlocks: [
							{
								clientId:
									'72b5d32d-35df-4530-8c81-ce67baaf34d1',
								name: 'core/group',
								isValid: true,
								attributes: {
									tagName: 'div',
									style: {
										layout: {
											selfStretch: 'fixed',
											flexSize: '320px',
										},
										spacing: {
											blockGap: '24px',
										},
									},
									layout: {
										type: 'default',
									},
								},
								innerBlocks: [
									{
										clientId:
											'86b7c5b3-2de6-42ff-9d41-d38dd267a122',
										name: 'core/paragraph',
										isValid: true,
										attributes: {
											content:
												"Let 'em Roll is an album by American organist Big John Patton recorded in 1965 and released on the Blue Note label.",
											dropCap: false,
											style: {
												layout: {
													selfStretch: 'fixed',
													flexSize: '330px',
												},
												typography: {
													fontSize: '17px',
													fontStyle: 'normal',
													fontWeight: '300',
													lineHeight: '1.4',
													textTransform: 'none',
													textDecoration: 'none',
													letterSpacing: '0px',
												},
											},
										},
										innerBlocks: [],
										originalContent:
											'<p style="font-size:17px;font-style:normal;font-weight:300;letter-spacing:0px;line-height:1.4;text-decoration:none;text-transform:none">Let \'em Roll is an album by American organist Big John Patton recorded in 1965 and released on the Blue Note label.</p>',
										validationIssues: [],
									},
									{
										clientId:
											'50d8d1c7-05dd-41d4-af67-29449e818ef7',
										name: 'core/buttons',
										isValid: true,
										attributes: {},
										innerBlocks: [
											{
												clientId:
													'3e26f576-a29a-4947-85f2-1454ea85db60',
												name: 'core/button',
												isValid: true,
												attributes: {
													tagName: 'a',
													type: 'button',
													text: 'Shop Now',
													backgroundColor: 'black',
													textColor: 'white',
													style: {
														typography: {
															fontSize: '17px',
															fontStyle: 'normal',
															fontWeight: '700',
															textDecoration:
																'none',
															textTransform:
																'uppercase',
															letterSpacing:
																'0px',
														},
														spacing: {
															padding: {
																top: '14px',
																bottom: '14px',
																left: '36px',
																right: '36px',
															},
														},
														border: {
															radius: '0px',
															top: {
																radius: '0px',
																width: '0px',
																style: 'none',
															},
															right: {
																radius: '0px',
																width: '0px',
																style: 'none',
															},
															bottom: {
																radius: '0px',
																width: '0px',
																style: 'none',
															},
															left: {
																radius: '0px',
																width: '0px',
																style: 'none',
															},
														},
													},
												},
												innerBlocks: [],
												originalContent:
													'<div class="wp-block-button has-custom-font-size" style="font-size:17px;font-style:normal;font-weight:700;letter-spacing:0px;text-decoration:none;text-transform:uppercase"><a class="wp-block-button__link has-white-color has-black-background-color has-text-color has-background wp-element-button" style="border-radius:0px;border-top-style:none;border-top-width:0px;border-right-style:none;border-right-width:0px;border-bottom-style:none;border-bottom-width:0px;border-left-style:none;border-left-width:0px;padding-top:14px;padding-right:36px;padding-bottom:14px;padding-left:36px">Shop Now</a></div>',
												validationIssues: [],
											},
										],
										originalContent:
											'<div class="wp-block-buttons"></div>',
										validationIssues: [],
									},
								],
								originalContent:
									'<div class="wp-block-group">\n\n</div>',
								validationIssues: [],
							},
							{
								clientId:
									'e8176dce-481f-4454-8e01-13bc5382e0fd',
								name: 'core/group',
								isValid: true,
								attributes: {
									tagName: 'div',
									style: {
										spacing: {
											blockGap: '0px',
										},
										layout: {
											selfStretch: 'fill',
											flexSize: null,
										},
									},
									layout: {
										type: 'default',
									},
								},
								innerBlocks: [
									{
										clientId:
											'738291ae-b0d1-4867-90b5-f35b999ca407',
										name: 'core/paragraph',
										isValid: true,
										attributes: {
											align: 'right',
											content: "Let<br>'EM<br>Roll",
											dropCap: false,
											style: {
												typography: {
													fontSize: '148px',
													textTransform: 'uppercase',
													fontStyle: 'normal',
													fontWeight: '700',
													lineHeight: '0.8',
													letterSpacing: '-4px',
												},
											},
											textColor: 'black',
										},
										innerBlocks: [],
										originalContent:
											'<p class="has-text-align-right has-black-color has-text-color" style="font-size:148px;font-style:normal;font-weight:700;letter-spacing:-4px;line-height:0.8;text-transform:uppercase">Let<br>\'EM<br>Roll</p>',
										validationIssues: [],
									},
									{
										clientId:
											'331df46f-7623-49a1-8031-7c421bddc15a',
										name: 'core/paragraph',
										isValid: true,
										attributes: {
											align: 'right',
											content: 'Big<br>John<br>Patton',
											dropCap: false,
											style: {
												typography: {
													fontSize: '148px',
													textTransform: 'uppercase',
													fontStyle: 'normal',
													fontWeight: '700',
													lineHeight: '0.8',
													letterSpacing: '-4px',
												},
											},
											textColor: 'white',
										},
										innerBlocks: [],
										originalContent:
											'<p class="has-text-align-right has-white-color has-text-color" style="font-size:148px;font-style:normal;font-weight:700;letter-spacing:-4px;line-height:0.8;text-transform:uppercase">Big<br>John<br>Patton</p>',
										validationIssues: [],
									},
								],
								originalContent:
									'<div class="wp-block-group">\n\n</div>',
								validationIssues: [],
							},
						],
						originalContent:
							'<div class="wp-block-group">\n\n</div>',
						validationIssues: [],
					},
				],
				originalContent:
					'<div class="wp-block-cover alignfull is-light" style="margin-top:0;padding-top:5vw;padding-right:5vw;padding-bottom:5vw;padding-left:5vw"><span aria-hidden="true" class="wp-block-cover__background has-background-dim-100 has-background-dim" style="background-color:#e68b14"></span><div class="wp-block-cover__inner-container"></div></div>',
				validationIssues: [],
			},
		],
	},
	{
		name: 'test/3',
		title: 'Two columns of text with offset heading',
		blocks: [
			{
				clientId: 'da715d18-2126-4be0-bf13-3328419f220a',
				name: 'core/group',
				isValid: true,
				attributes: {
					tagName: 'div',
					align: 'full',
					style: {
						color: {
							background: '#f2f0e9',
						},
					},
				},
				innerBlocks: [
					{
						clientId: '8a89e4af-1f70-4545-9d1e-887ff50a141d',
						name: 'core/spacer',
						isValid: true,
						attributes: {
							height: '70px',
						},
						innerBlocks: [],
						originalContent:
							'<div style="height:70px" aria-hidden="true" class="wp-block-spacer"></div>',
						validationIssues: [],
					},
					{
						clientId: '4ab42169-0fcd-416a-bd34-487f6a4e33ad',
						name: 'core/columns',
						isValid: true,
						attributes: {
							verticalAlignment: 'center',
							isStackedOnMobile: true,
							align: 'wide',
						},
						innerBlocks: [
							{
								clientId:
									'88b53c37-16dc-4396-b9bc-6cc115411d9a',
								name: 'core/column',
								isValid: true,
								attributes: {
									width: '50%',
								},
								innerBlocks: [
									{
										clientId:
											'1b5a12e4-06cf-4f78-b665-7440771d0025',
										name: 'core/paragraph',
										isValid: true,
										attributes: {
											content:
												'<strong>Oceanic Inspiration</strong>',
											dropCap: false,
											style: {
												typography: {
													lineHeight: '1.1',
													fontSize: '30px',
												},
												color: {
													text: '#000000',
												},
											},
										},
										innerBlocks: [],
										originalContent:
											'<p class="has-text-color" style="color:#000000;font-size:30px;line-height:1.1"><strong>Oceanic Inspiration</strong></p>',
										validationIssues: [],
									},
								],
								originalContent:
									'<div class="wp-block-column" style="flex-basis:50%"></div>',
								validationIssues: [],
							},
							{
								clientId:
									'82b7e2aa-dcd8-4b34-a2a9-d239192fed71',
								name: 'core/column',
								isValid: true,
								attributes: {
									width: '50%',
								},
								innerBlocks: [
									{
										clientId:
											'b0fbba51-f3ec-40d5-91d6-64a24ae223f4',
										name: 'core/separator',
										isValid: true,
										attributes: {
											className: 'is-style-wide',
											opacity: 'css',
											style: {
												color: {
													background: '#000000',
												},
											},
											tagName: 'hr',
										},
										innerBlocks: [],
										originalContent:
											'<hr class="wp-block-separator has-text-color has-background is-style-wide" style="background-color:#000000;color:#000000" />',
										validationIssues: [],
									},
								],
								originalContent:
									'<div class="wp-block-column" style="flex-basis:50%"></div>',
								validationIssues: [],
							},
						],
						originalContent:
							'<div class="wp-block-columns alignwide are-vertically-aligned-center">\n\n</div>',
						validationIssues: [],
					},
					{
						clientId: '72d3dc7f-bbbe-4088-b556-a32c07191068',
						name: 'core/columns',
						isValid: true,
						attributes: {
							isStackedOnMobile: true,
							align: 'wide',
						},
						innerBlocks: [
							{
								clientId:
									'cf3abb5c-eee8-4314-af70-022b4f7e5bc4',
								name: 'core/column',
								isValid: true,
								attributes: {},
								innerBlocks: [],
								originalContent:
									'<div class="wp-block-column"></div>',
								validationIssues: [],
							},
							{
								clientId:
									'6978a278-bcf8-4244-9e99-bf5b56fe0f5e',
								name: 'core/column',
								isValid: true,
								attributes: {},
								innerBlocks: [
									{
										clientId:
											'26a6b210-07b6-49b1-8c0b-41d0760562a5',
										name: 'core/paragraph',
										isValid: true,
										attributes: {
											content:
												'Winding veils round their heads, the women walked on deck. They were now moving steadily down the river, passing the dark shapes of ships at anchor, and London was a swarm of lights with a pale yellow canopy drooping above it. There were the lights of the great theatres, the lights of the long streets, lights that indicated huge squares of domestic comfort, lights that hung high in air.',
											dropCap: false,
											style: {
												color: {
													text: '#000000',
												},
											},
											fontSize: 'extra-small',
										},
										innerBlocks: [],
										originalContent:
											'<p class="has-text-color has-extra-small-font-size" style="color:#000000">Winding veils round their heads, the women walked on deck. They were now moving steadily down the river, passing the dark shapes of ships at anchor, and London was a swarm of lights with a pale yellow canopy drooping above it. There were the lights of the great theatres, the lights of the long streets, lights that indicated huge squares of domestic comfort, lights that hung high in air.</p>',
										validationIssues: [],
									},
								],
								originalContent:
									'<div class="wp-block-column"></div>',
								validationIssues: [],
							},
							{
								clientId:
									'53ac5018-2b60-429e-b893-fce01f8bad24',
								name: 'core/column',
								isValid: true,
								attributes: {},
								innerBlocks: [
									{
										clientId:
											'10a12c7d-77b5-46c7-8215-ff2f94ed4e27',
										name: 'core/paragraph',
										isValid: true,
										attributes: {
											content:
												'No darkness would ever settle upon those lamps, as no darkness had settled upon them for hundreds of years. It seemed dreadful that the town should blaze for ever in the same spot; dreadful at least to people going away to adventure upon the sea, and beholding it as a circumscribed mound, eternally burnt, eternally scarred. From the deck of the ship the great city appeared a crouched and cowardly figure, a sedentary miser.',
											dropCap: false,
											style: {
												color: {
													text: '#000000',
												},
											},
											fontSize: 'extra-small',
										},
										innerBlocks: [],
										originalContent:
											'<p class="has-text-color has-extra-small-font-size" style="color:#000000">No darkness would ever settle upon those lamps, as no darkness had settled upon them for hundreds of years. It seemed dreadful that the town should blaze for ever in the same spot; dreadful at least to people going away to adventure upon the sea, and beholding it as a circumscribed mound, eternally burnt, eternally scarred. From the deck of the ship the great city appeared a crouched and cowardly figure, a sedentary miser.</p>',
										validationIssues: [],
									},
								],
								originalContent:
									'<div class="wp-block-column"></div>',
								validationIssues: [],
							},
						],
						originalContent:
							'<div class="wp-block-columns alignwide">\n\n\n\n</div>',
						validationIssues: [],
					},
					{
						clientId: 'f401521c-d5d4-486a-b069-47350b032dc9',
						name: 'core/spacer',
						isValid: true,
						attributes: {
							height: '40px',
						},
						innerBlocks: [],
						originalContent:
							'<div style="height:40px" aria-hidden="true" class="wp-block-spacer"></div>',
						validationIssues: [],
					},
				],
				originalContent:
					'<div class="wp-block-group alignfull has-background" style="background-color:#f2f0e9">\n\n\n\n\n\n</div>',
				validationIssues: [],
			},
		],
	},
	{
		name: 'test/4',
		title: 'Offset text with a brutalist design vibe',
		blocks: [
			{
				clientId: 'ac947e62-0568-4fa2-85a0-927b86c8ae42',
				name: 'core/cover',
				isValid: true,
				attributes: {
					alt: '',
					hasParallax: false,
					isRepeated: false,
					dimRatio: 100,
					customOverlayColor: '#ffb43c',
					backgroundType: 'image',
					minHeight: 66,
					minHeightUnit: 'vh',
					isDark: false,
					useFeaturedImage: false,
					tagName: 'div',
					align: 'full',
					textColor: 'black',
					style: {
						spacing: {
							padding: {
								top: '48px',
								right: '48px',
								bottom: '48px',
								left: '48px',
							},
							margin: {
								top: '0',
							},
						},
					},
					isUserOverlayColor: true,
				},
				innerBlocks: [
					{
						clientId: 'a23ab6aa-b6dc-4148-a7fc-a4ad04deb738',
						name: 'core/group',
						isValid: true,
						attributes: {
							tagName: 'div',
							style: {
								spacing: {
									blockGap: '0px',
								},
							},
							layout: {
								type: 'constrained',
								wideSize: '1200px',
								contentSize: '800px',
							},
						},
						innerBlocks: [
							{
								clientId:
									'2cd000fa-8e5b-4edc-8238-5912c5e397d2',
								name: 'core/paragraph',
								isValid: true,
								attributes: {
									align: 'left',
									content:
										'<mark style="color:#a65a00" class="has-inline-color">✴︎</mark> Walk',
									dropCap: false,
									style: {
										typography: {
											fontSize: '148px',
											textTransform: 'uppercase',
											fontStyle: 'normal',
											fontWeight: '700',
											lineHeight: '0.9',
											letterSpacing: '-2px',
										},
									},
									textColor: 'black',
								},
								innerBlocks: [],
								originalContent:
									'<p class="has-text-align-left has-black-color has-text-color" style="font-size:148px;font-style:normal;font-weight:700;letter-spacing:-2px;line-height:0.9;text-transform:uppercase"><mark style="color:#a65a00" class="has-inline-color">✴︎</mark> Walk</p>',
								validationIssues: [],
							},
							{
								clientId:
									'2d747e99-c672-4d7f-91d4-f8f03d295f2b',
								name: 'core/paragraph',
								isValid: true,
								attributes: {
									align: 'right',
									content: 'In the',
									dropCap: false,
									style: {
										typography: {
											fontSize: '148px',
											textTransform: 'uppercase',
											fontStyle: 'normal',
											fontWeight: '700',
											lineHeight: '0.9',
											letterSpacing: '-2px',
										},
									},
									textColor: 'black',
								},
								innerBlocks: [],
								originalContent:
									'<p class="has-text-align-right has-black-color has-text-color" style="font-size:148px;font-style:normal;font-weight:700;letter-spacing:-2px;line-height:0.9;text-transform:uppercase">In the</p>',
								validationIssues: [],
							},
							{
								clientId:
									'd63e34e7-8943-49ff-bc05-8749809f4117',
								name: 'core/paragraph',
								isValid: true,
								attributes: {
									align: 'left',
									content: 'Park',
									dropCap: false,
									style: {
										typography: {
											fontSize: '148px',
											textTransform: 'uppercase',
											fontStyle: 'normal',
											fontWeight: '700',
											lineHeight: '0.9',
											letterSpacing: '-2px',
										},
									},
									textColor: 'black',
								},
								innerBlocks: [],
								originalContent:
									'<p class="has-text-align-left has-black-color has-text-color" style="font-size:148px;font-style:normal;font-weight:700;letter-spacing:-2px;line-height:0.9;text-transform:uppercase">Park</p>',
								validationIssues: [],
							},
							{
								clientId:
									'e996575b-4ada-43b1-8ae1-a6dbb2ec0ecc',
								name: 'core/paragraph',
								isValid: true,
								attributes: {
									align: 'center',
									content: '—01.03',
									dropCap: false,
									style: {
										typography: {
											fontSize: '140px',
											textTransform: 'uppercase',
											fontStyle: 'italic',
											fontWeight: '200',
											letterSpacing: '0px',
											lineHeight: '0.9',
										},
										color: {
											text: '#a65a00',
										},
									},
								},
								innerBlocks: [],
								originalContent:
									'<p class="has-text-align-center has-text-color" style="color:#a65a00;font-size:140px;font-style:italic;font-weight:200;letter-spacing:0px;line-height:0.9;text-transform:uppercase">—01.03</p>',
								validationIssues: [],
							},
						],
						originalContent:
							'<div class="wp-block-group">\n\n\n\n\n\n</div>',
						validationIssues: [],
					},
				],
				originalContent:
					'<div class="wp-block-cover alignfull is-light has-black-color has-text-color" style="margin-top:0;padding-top:48px;padding-right:48px;padding-bottom:48px;padding-left:48px;min-height:66vh"><span aria-hidden="true" class="wp-block-cover__background has-background-dim-100 has-background-dim" style="background-color:#ffb43c"></span><div class="wp-block-cover__inner-container"></div></div>',
				validationIssues: [],
			},
		],
	},
];
