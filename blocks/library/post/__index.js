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

const getPostLayout = [
	{
		name: 'core/cover-image',
		label: __( 'Post image' ),
		icon: 'image',
	},
	{
		name: 'core/paragraph',
		label: __( 'Post title' ),
		icon: 'image',
	},
];

export const name = 'custom/post';

export const settings = {
	title: 'Post',

	description: __( 'Post has an image and a title.' ),

	icon: 'universal-access-alt',

	category: 'common',

	attributes: {

	},

	edit( { className } ) {
		const classes = classnames( className );

		return [
			<div className={ classes } key="container">
				<InnerBlocks layouts={ getPostLayout } />
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
