/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

import {
	InnerBlocks,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import deprecated from './deprecated';
import edit from './edit';
import icon from './icon';

export const name = 'core/columns';

export const settings = {
	title: __( 'Columns' ),

	icon,

	category: 'layout',

	attributes: {
		columns: {
			type: 'number',
			default: 2,
		},
		verticalAlignment: {
			type: 'string',
		},
	},

	description: __( 'Add a block that displays content in multiple columns, then add whatever content blocks you’d like.' ),

	supports: {
		align: [ 'wide', 'full' ],
		html: false,
	},

	deprecated,

	edit,

	save( { attributes } ) {
		const { columns, verticalAlignment } = attributes;

		const wrapperClasses = classnames( `has-${ columns }-columns`, {
			[ `are-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
		} );

		return (
			<div className={ wrapperClasses }>
				<InnerBlocks.Content />
			</div>
		);
	},
};

