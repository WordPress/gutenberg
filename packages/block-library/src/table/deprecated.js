/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	RichText,
	getColorClassName,
	useBlockProps,
} from '@wordpress/block-editor';

const supports = {
	align: true,
};

// As the previous arbitrary colors won't match theme color palettes, the hex
// value will be mapped to the style.color.background attribute as if it was
// a custom color selection.
const oldColors = {
	'subtle-light-gray': '#f3f4f5',
	'subtle-pale-green': '#e9fbe5',
	'subtle-pale-blue': '#e7f5fe',
	'subtle-pale-pink': '#fcf0ef',
};

const deprecated = [
	// Deprecation migrating table block to use colors block support feature.
	{
		attributes: {
			hasFixedLayout: {
				type: 'boolean',
				default: false,
			},
			backgroundColor: {
				type: 'string',
			},
			caption: {
				type: 'string',
				source: 'html',
				selector: 'figcaption',
				default: '',
			},
			head: {
				type: 'array',
				default: [],
				source: 'query',
				selector: 'thead tr',
				query: {
					cells: {
						type: 'array',
						default: [],
						source: 'query',
						selector: 'td,th',
						query: {
							content: {
								type: 'string',
								source: 'html',
							},
							tag: {
								type: 'string',
								default: 'td',
								source: 'tag',
							},
							scope: {
								type: 'string',
								source: 'attribute',
								attribute: 'scope',
							},
							align: {
								type: 'string',
								source: 'attribute',
								attribute: 'data-align',
							},
						},
					},
				},
			},
			body: {
				type: 'array',
				default: [],
				source: 'query',
				selector: 'tbody tr',
				query: {
					cells: {
						type: 'array',
						default: [],
						source: 'query',
						selector: 'td,th',
						query: {
							content: {
								type: 'string',
								source: 'html',
							},
							tag: {
								type: 'string',
								default: 'td',
								source: 'tag',
							},
							scope: {
								type: 'string',
								source: 'attribute',
								attribute: 'scope',
							},
							align: {
								type: 'string',
								source: 'attribute',
								attribute: 'data-align',
							},
						},
					},
				},
			},
			foot: {
				type: 'array',
				default: [],
				source: 'query',
				selector: 'tfoot tr',
				query: {
					cells: {
						type: 'array',
						default: [],
						source: 'query',
						selector: 'td,th',
						query: {
							content: {
								type: 'string',
								source: 'html',
							},
							tag: {
								type: 'string',
								default: 'td',
								source: 'tag',
							},
							scope: {
								type: 'string',
								source: 'attribute',
								attribute: 'scope',
							},
							align: {
								type: 'string',
								source: 'attribute',
								attribute: 'data-align',
							},
						},
					},
				},
			},
		},
		supports: {
			anchor: true,
			align: true,
			__experimentalSelector: '.wp-block-table > table',
		},
		save: ( { attributes } ) => {
			const {
				hasFixedLayout,
				head,
				body,
				foot,
				backgroundColor,
				caption,
			} = attributes;
			const isEmpty = ! head.length && ! body.length && ! foot.length;

			if ( isEmpty ) {
				return null;
			}

			const backgroundClass = getColorClassName(
				'background-color',
				backgroundColor
			);

			const classes = classnames( backgroundClass, {
				'has-fixed-layout': hasFixedLayout,
				'has-background': !! backgroundClass,
			} );

			const hasCaption = ! RichText.isEmpty( caption );

			const Section = ( { type, rows } ) => {
				if ( ! rows.length ) {
					return null;
				}

				const Tag = `t${ type }`;

				return (
					<Tag>
						{ rows.map( ( { cells }, rowIndex ) => (
							<tr key={ rowIndex }>
								{ cells.map(
									(
										{ content, tag, scope, align },
										cellIndex
									) => {
										const cellClasses = classnames( {
											[ `has-text-align-${ align }` ]: align,
										} );

										return (
											<RichText.Content
												className={
													cellClasses
														? cellClasses
														: undefined
												}
												data-align={ align }
												tagName={ tag }
												value={ content }
												key={ cellIndex }
												scope={
													tag === 'th'
														? scope
														: undefined
												}
											/>
										);
									}
								) }
							</tr>
						) ) }
					</Tag>
				);
			};

			return (
				<figure { ...useBlockProps.save() }>
					<table className={ classes === '' ? undefined : classes }>
						<Section type="head" rows={ head } />
						<Section type="body" rows={ body } />
						<Section type="foot" rows={ foot } />
					</table>
					{ hasCaption && (
						<RichText.Content
							tagName="figcaption"
							value={ caption }
						/>
					) }
				</figure>
			);
		},
		isEligible: ( attributes ) => {
			return (
				attributes.backgroundColor &&
				attributes.backgroundColor in oldColors &&
				! attributes.style
			);
		},

		// This version is the first to introduce the style attribute to the
		// table block. As a result, we'll explicitly override that.
		migrate: ( attributes ) => {
			return {
				...attributes,
				backgroundColor: undefined,
				style: {
					color: {
						background: oldColors[ attributes.backgroundColor ],
					},
				},
			};
		},
	},
	{
		attributes: {
			hasFixedLayout: {
				type: 'boolean',
				default: false,
			},
			backgroundColor: {
				type: 'string',
			},
			head: {
				type: 'array',
				default: [],
				source: 'query',
				selector: 'thead tr',
				query: {
					cells: {
						type: 'array',
						default: [],
						source: 'query',
						selector: 'td,th',
						query: {
							content: {
								type: 'string',
								source: 'html',
							},
							tag: {
								type: 'string',
								default: 'td',
								source: 'tag',
							},
							scope: {
								type: 'string',
								source: 'attribute',
								attribute: 'scope',
							},
						},
					},
				},
			},
			body: {
				type: 'array',
				default: [],
				source: 'query',
				selector: 'tbody tr',
				query: {
					cells: {
						type: 'array',
						default: [],
						source: 'query',
						selector: 'td,th',
						query: {
							content: {
								type: 'string',
								source: 'html',
							},
							tag: {
								type: 'string',
								default: 'td',
								source: 'tag',
							},
							scope: {
								type: 'string',
								source: 'attribute',
								attribute: 'scope',
							},
						},
					},
				},
			},
			foot: {
				type: 'array',
				default: [],
				source: 'query',
				selector: 'tfoot tr',
				query: {
					cells: {
						type: 'array',
						default: [],
						source: 'query',
						selector: 'td,th',
						query: {
							content: {
								type: 'string',
								source: 'html',
							},
							tag: {
								type: 'string',
								default: 'td',
								source: 'tag',
							},
							scope: {
								type: 'string',
								source: 'attribute',
								attribute: 'scope',
							},
						},
					},
				},
			},
		},
		supports,
		save( { attributes } ) {
			const {
				hasFixedLayout,
				head,
				body,
				foot,
				backgroundColor,
			} = attributes;
			const isEmpty = ! head.length && ! body.length && ! foot.length;

			if ( isEmpty ) {
				return null;
			}

			const backgroundClass = getColorClassName(
				'background-color',
				backgroundColor
			);

			const classes = classnames( backgroundClass, {
				'has-fixed-layout': hasFixedLayout,
				'has-background': !! backgroundClass,
			} );

			const Section = ( { type, rows } ) => {
				if ( ! rows.length ) {
					return null;
				}

				const Tag = `t${ type }`;

				return (
					<Tag>
						{ rows.map( ( { cells }, rowIndex ) => (
							<tr key={ rowIndex }>
								{ cells.map(
									( { content, tag, scope }, cellIndex ) => (
										<RichText.Content
											tagName={ tag }
											value={ content }
											key={ cellIndex }
											scope={
												tag === 'th' ? scope : undefined
											}
										/>
									)
								) }
							</tr>
						) ) }
					</Tag>
				);
			};

			return (
				<table className={ classes }>
					<Section type="head" rows={ head } />
					<Section type="body" rows={ body } />
					<Section type="foot" rows={ foot } />
				</table>
			);
		},
	},
];

export default deprecated;
