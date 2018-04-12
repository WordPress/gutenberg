/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { InnerBlocks } from '@wordpress/blocks';

const getArticleLayout = [
	{
		name: 'core/cover-image',
		label: __( 'Article image' ),
		icon: 'image',
	},
	{
		name: 'core/paragraph',
		label: __( 'Article title' ),
		icon: 'image',
	},
];

export const name = 'dynamic/article';

export const settings = {
	title: 'Article',

	description: __( 'Article has an image and a title.' ),

	icon: 'universal-access-alt',

	category: 'common',

	attributes: {

	},

	edit( { className } ) {
		const classes = classnames( className );

		return [
			<div className={ classes } key="container">
				<InnerBlocks layouts={ getArticleLayout } />
			</div>,
		];
	},

	save( { className } ) {
		const classes = classnames( className );

		return (
			<div className={ classes }>
				<InnerBlocks.Content />
			</div>
		);
	},
};
