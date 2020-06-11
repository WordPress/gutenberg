/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import metadata from './block.json';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Checklist Item' ),
	description: __( 'Check!' ),
	icon: 'yes-alt',
	parent: [ 'core/checklist' ],
	save,
	edit,
	merge( { value: a = '' }, { value: b = '' } ) {
		return { value: a + b };
	},
};
