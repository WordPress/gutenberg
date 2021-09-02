/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

const justifyContentMap = {
	left: 'flex-start',
	right: 'flex-end',
	center: 'center',
	'space-between': 'space-between',
};

// TODO: this is temp implementation to test quickly.
// This will need to be applied to the others migrations.
// The problem exists because `itemsJustification` was introduced in https://github.com/WordPress/gutenberg/pull/28980/files
// and wasn't declared in block.json (https://github.com/WordPress/gutenberg/issues/34003).
const migrateWithLayout = ( attributes ) => {
	if ( !! attributes.layout ) {
		return attributes;
	}

	let justifyContent = 'flex-start';
	let className = attributes.className;
	const cssClasses = className?.split( ' ' );
	if ( cssClasses ) {
		const prefix = 'item-justified-';
		className = cssClasses.reduce( ( accumulator, cssClass ) => {
			if ( ! cssClass.startsWith( prefix ) ) {
				justifyContent =
					justifyContentMap[ cssClass.slice( prefix.length + 1 ) ];
				return accumulator;
			}
			return `${ accumulator } ${ cssClass }`;
		}, '' );
	}
	return {
		...attributes,
		className,
		layout: {
			type: 'flex',
			justifyContent,
		},
	};
};

// Social Links block deprecations.
const deprecated = [
	// Implement `flex` layout.
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
		isEligible: ( { layout } ) => ! layout,
		migrate: migrateWithLayout,
		save( props ) {
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

			return (
				<ul { ...useBlockProps.save( { className } ) }>
					<InnerBlocks.Content />
				</ul>
			);
		},
	},
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
