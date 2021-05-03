/**
 * WordPress dependencies
 */
import { getBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import edit from './edit';
import metadata from './block.json';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	name,
	__experimentalLabel( attributes, { context } ) {
		if ( context === 'accessibility' ) {
			const { originalName } = attributes;

			const originalBlockType = originalName
				? getBlockType( originalName )
				: undefined;

			if ( originalBlockType ) {
				return originalBlockType.settings.title || originalName;
			}

			return '';
		}
	},
	edit,
	save,
};
