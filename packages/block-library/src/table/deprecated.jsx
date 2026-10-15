import clsx from 'clsx';
import {
	RichText,
	getColorClassName,
	useBlockProps,
	__experimentalGetBorderClassesAndStyles as getBorderClassesAndStyles,
	__experimentalGetColorClassesAndStyles as getColorClassesAndStyles,
	__experimentalGetElementClassName,
	getBackgroundClassesAndStyles,
} from '@wordpress/block-editor';

function tableHasHeaderCellsWithoutScope( attributes ) {
	return attributes.head?.some( ( row ) =>
		row.cells?.some( ( cell ) => cell.tag === 'th' && ! cell.scope )
	);
}

/**
 * Table blocks often store row data in saved HTML with empty block comment attrs.
 * `isEligible` receives raw `attrs` first; use parsed block attributes when present.
 *
 * @param {Object} attributes   Block attributes from the block comment.
 * @param {Array}  _innerBlocks Inner blocks (unused).
 * @param {Object} root0        Deprecation eligibility context.
 * @param {Object} root0.block  Parsed block including attributes from HTML.
 * @return {boolean} Whether the block should be migrated to add header scope.
 */
function isEligibleForHeaderScopeMigration(
	attributes,
	_innerBlocks,
	{ block } = {}
) {
	const blockAttributes = block?.attributes ?? attributes;
	return tableHasHeaderCellsWithoutScope( blockAttributes );
}

/**
 * Adds `scope="col"` to header `<th>` cells that do not already define `scope`.
 *
 * @param {Object} attributes Block attributes before migration.
 * @return {Object} Block attributes with `head` cells updated where applicable.
 */
function migrateHeaderCellScope( attributes ) {
	const migratedHead = attributes.head?.map( ( row ) => ( {
		...row,
		cells: row.cells.map( ( cell ) => {
			if ( cell.tag === 'th' && ! cell.scope ) {
				return {
					...cell,
					scope: 'col',
				};
			}
			return cell;
		} ),
	} ) );

	return {
		...attributes,
		head: migratedHead || attributes.head,
	};
}

// As the previous arbitrary colors won't match theme color palettes, the hex
// value will be mapped to the style.color.background attribute as if it was
// a custom color selection.
const oldColors = {
	'subtle-light-gray': '#f3f4f5',
	'subtle-pale-green': '#e9fbe5',
	'subtle-pale-blue': '#e7f5fe',
	'subtle-pale-pink': '#fcf0ef',
};

// Add scope="col" to header cells for accessibility.
const v5Query = {
	content: {
		type: 'rich-text',
		source: 'rich-text',
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
	colspan: {
		type: 'string',
		source: 'attribute',
		attribute: 'colspan',
	},
	rowspan: {
		type: 'string',
		source: 'attribute',
		attribute: 'rowspan',
	},
};

const v5 = {
	attributes: {
		hasFixedLayout: {
			type: 'boolean',
			default: true,
		},
		caption: {
			type: 'rich-text',
			source: 'rich-text',
			selector: 'figcaption',
		},
		style: {
			type: 'object',
			default: {},
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
					query: v5Query,
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
					query: v5Query,
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
					query: v5Query,
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
			__experimentalDefaultControls: {
				margin: false,
				padding: false,
			},
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
		interactivity: {
			clientNavigation: true,
		},
	},
	save( { attributes } ) {
		const { hasFixedLayout, head, body, foot, caption, style } = attributes;
		const isEmpty = ! head.length && ! body.length && ! foot.length;

		if ( isEmpty ) {
			return null;
		}

		const colorProps = getColorClassesAndStyles( {
			...attributes,
			style: { ...style, elements: undefined },
		} );
		const borderProps = getBorderClassesAndStyles( attributes );
		const backgroundProps = getBackgroundClassesAndStyles( attributes );

		const textAlign = style?.typography?.textAlign;

		const classes = clsx(
			colorProps.className,
			borderProps.className,
			backgroundProps.className,
			{
				'has-fixed-layout': hasFixedLayout,
				[ `has-text-align-${ textAlign }` ]: textAlign,
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
									{
										content,
										tag,
										scope,
										align,
										colspan,
										rowspan,
									},
									cellIndex
								) => {
									const cellClasses = clsx( {
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
											colSpan={ colspan }
											rowSpan={ rowspan }
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
					style={ {
						...colorProps.style,
						...borderProps.style,
						...backgroundProps.style,
					} }
				>
					<Section type="head" rows={ head } />
					<Section type="body" rows={ body } />
					<Section type="foot" rows={ foot } />
				</table>
				{ hasCaption && (
					<RichText.Content
						tagName="figcaption"
						value={ caption }
						className={ __experimentalGetElementClassName(
							'caption'
						) }
					/>
				) }
			</figure>
		);
	},
	isEligible: isEligibleForHeaderScopeMigration,
	migrate: migrateHeaderCellScope,
};

// Fixed width table cells on by default.
const v4Query = {
	content: {
		type: 'rich-text',
		source: 'rich-text',
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
	colspan: {
		type: 'string',
		source: 'attribute',
		attribute: 'colspan',
	},
	rowspan: {
		type: 'string',
		source: 'attribute',
		attribute: 'rowspan',
	},
};

const v4 = {
	attributes: {
		hasFixedLayout: {
			type: 'boolean',
			default: false,
		},
		caption: {
			type: 'rich-text',
			source: 'rich-text',
			selector: 'figcaption',
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
					query: v4Query,
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
					query: v4Query,
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
					query: v4Query,
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
			__experimentalDefaultControls: {
				margin: false,
				padding: false,
			},
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
		interactivity: {
			clientNavigation: true,
		},
	},
	save( { attributes } ) {
		const { hasFixedLayout, head, body, foot, caption } = attributes;
		const isEmpty = ! head.length && ! body.length && ! foot.length;

		if ( isEmpty ) {
			return null;
		}

		const colorProps = getColorClassesAndStyles( attributes );
		const borderProps = getBorderClassesAndStyles( attributes );

		const classes = clsx( colorProps.className, borderProps.className, {
			'has-fixed-layout': hasFixedLayout,
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
									{
										content,
										tag,
										scope,
										align,
										colspan,
										rowspan,
									},
									cellIndex
								) => {
									const cellClasses = clsx( {
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
											colSpan={ colspan }
											rowSpan={ rowspan }
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
					<RichText.Content
						tagName="figcaption"
						value={ caption }
						className={ __experimentalGetElementClassName(
							'caption'
						) }
					/>
				) }
			</figure>
		);
	},
};

// In #41140 support was added to global styles for caption elements which
// added a `wp-element-caption` classname to the embed figcaption element.
const v3Query = {
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
};

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
					query: v3Query,
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
					query: v3Query,
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
					query: v3Query,
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

		const classes = clsx( colorProps.className, borderProps.className, {
			'has-fixed-layout': hasFixedLayout,
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
									const cellClasses = clsx( {
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
const v2Query = {
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
};

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
					query: v2Query,
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
					query: v2Query,
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
					query: v2Query,
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

		const classes = clsx( backgroundClass, {
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
									const cellClasses = clsx( {
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

const v1Query = {
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
					query: v1Query,
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
					query: v1Query,
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
					query: v1Query,
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

		const classes = clsx( backgroundClass, {
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
export default [ v5, v4, v3, v2, v1 ];
