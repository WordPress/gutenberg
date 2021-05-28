/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

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
