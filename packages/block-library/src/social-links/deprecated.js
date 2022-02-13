/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

/**
 * The specific handling by `className` below is needed because `itemsJustification`
 * was introduced in https://github.com/WordPress/gutenberg/pull/28980/files and wasn't
 * declared in block.json.
 *
 * @param {Object} attributes Block's attributes.
 */
const migrateWithLayout = ( attributes ) => {
	if ( !! attributes.layout ) {
		return attributes;
	}
	const { className } = attributes;
	// Matches classes with `items-justified-` prefix.
	const prefix = `items-justified-`;
	const justifiedItemsRegex = new RegExp( `\\b${ prefix }[^ ]*[ ]?\\b`, 'g' );
	const newAttributes = {
		...attributes,
		className: className?.replace( justifiedItemsRegex, '' ).trim(),
	};
	/**
	 * Add `layout` prop only if `justifyContent` is defined, for backwards
	 * compatibility. In other cases the block's default layout will be used.
	 * Also noting that due to the missing attribute, it's possible for a block
	 * to have more than one of `justified` classes.
	 */
	const justifyContent = className
		?.match( justifiedItemsRegex )?.[ 0 ]
		?.trim();
	if ( justifyContent ) {
		Object.assign( newAttributes, {
			layout: {
				type: 'flex',
				justifyContent: justifyContent.slice( prefix.length ),
			},
		} );
	}
	return newAttributes;
};

// Social Links block deprecations.
const deprecated = [
	// V1. Remove CSS variable use for colors.
	{
		attributes: {
			iconColor: {
				type: 'string',
			},
			customIconColor: {
				type: 'string',
			},
			iconColorValue: {
				type: 'string',
			},
			iconBackgroundColor: {
				type: 'string',
			},
			customIconBackgroundColor: {
				type: 'string',
			},
			iconBackgroundColorValue: {
				type: 'string',
			},
			openInNewTab: {
				type: 'boolean',
				default: false,
			},
			size: {
				type: 'string',
			},
		},
		providesContext: {
			openInNewTab: 'openInNewTab',
		},
		supports: {
			align: [ 'left', 'center', 'right' ],
			anchor: true,
		},
		migrate: migrateWithLayout,
		save: ( props ) => {
			const {
				attributes: {
					iconBackgroundColorValue,
					iconColorValue,
					itemsJustification,
					size,
				},
			} = props;

			const className = classNames( size, {
				'has-icon-color': iconColorValue,
				'has-icon-background-color': iconBackgroundColorValue,
				[ `items-justified-${ itemsJustification }` ]: itemsJustification,
			} );

			const style = {
				'--wp--social-links--icon-color': iconColorValue,
				'--wp--social-links--icon-background-color': iconBackgroundColorValue,
			};

			return (
				<ul { ...useBlockProps.save( { className, style } ) }>
					<InnerBlocks.Content />
				</ul>
			);
		},
	},
];

export default deprecated;
