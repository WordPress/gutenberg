/**
 * WordPress dependencies
 */
import { getBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';

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
	lazyEdit: () => import( /* webpackChunkName: "missing/editor" */ './edit' ),
	save,
};

export const init = () => initBlock( { name, metadata, settings } );
