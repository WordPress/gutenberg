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
	__experimentalGetBorderClassesAndStyles as getBorderClassesAndStyles,
	__experimentalGetColorClassesAndStyles as getColorClassesAndStyles,
} from '@wordpress/block-editor';

// As the previous arbitrary colors won't match theme color palettes, the hex
// value will be mapped to the style.color.background attribute as if it was
// a custom color selection.
const oldColors = {
	'subtle-light-gray': '#f3f4f5',
	'subtle-pale-green': '#e9fbe5',
	'subtle-pale-blue': '#e7f5fe',
	'subtle-pale-pink': '#fcf0ef',
};

// In #41140 support was added to global styles for caption elements which
// added a `wp-element-caption` classname to the embed figcaption element.
const v3 = {
	attributes: {
		hasFixedLayout: {
			type: 'boolean',
			default: false,
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
		color: {
			__experimentalSkipSerialization: true,
			gradients: true,
			__experimentalDefaultControls: {
				background: true,
				text: true,
			},
		},
		spacing: {
			margin: true,
			padding: true,
		},
		typography: {
			fontSize: true,
			lineHeight: true,
			__experimentalFontFamily: true,
			__experimentalFontStyle: true,
			__experimentalFontWeight: true,
			__experimentalLetterSpacing: true,
			__experimentalTextTransform: true,
			__experimentalTextDecoration: true,
			__experimentalDefaultControls: {
				fontSize: true,
			},
		},
		__experimentalBorder: {
			__experimentalSkipSerialization: true,
			color: true,
			style: true,
			width: true,
			__experimentalDefaultControls: {
				color: true,
				style: true,
				width: true,
			},
		},
		__experimentalSelector: '.wp-block-table > table',
	},
	save( { attributes } ) {
		const { hasFixedLayout, head, body, foot, caption } = attributes;
		const isEmpty = ! head.length && ! body.length && ! foot.length;

		if ( isEmpty ) {
			return null;
		}

		const colorProps = getColorClassesAndStyles( attributes );
		const borderProps = getBorderClassesAndStyles( attributes );

		const classes = classnames(
			colorProps.className,
			borderProps.className,
			{
				'has-fixed-layout': hasFixedLayout,
			}
		);

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
												tag === 'th' ? scope : undefined
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
				<table
					className={ classes === '' ? undefined : classes }
					style={ { ...colorProps.style, ...borderProps.style } }
				>
					<Section type="head" rows={ head } />
					<Section type="body" rows={ body } />
					<Section type="foot" rows={ foot } />
				</table>
				{ hasCaption && (
					<RichText.Content tagName="figcaption" value={ caption } />
				) }
			</figure>
		);
	},
};

// Deprecation migrating table block to use colors block support feature.
const v2 = {
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
		const { hasFixedLayout, head, body, foot, backgroundColor, caption } =
			attributes;
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
												tag === 'th' ? scope : undefined
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
					<RichText.Content tagName="figcaption" value={ caption } />
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
};

const v1 = {
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
	supports: {
		align: true,
	},
	save( { attributes } ) {
		const { hasFixedLayout, head, body, foot, backgroundColor } =
			attributes;
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
};

/**
 * New deprecations need to be placed first
 * for them to have higher priority.
 *
 * Old deprecations may need to be updated as well.
 *
 * See block-deprecation.md
 */
export default [ v3, v2, v1 ];
