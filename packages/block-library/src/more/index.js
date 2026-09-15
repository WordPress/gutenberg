import { more as icon } from '@wordpress/icons';
import initBlock from '../utils/init-block';
import edit from './edit';
import metadata from './block.json';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {},
	__experimentalLabel( attributes, { context } ) {
		const customName = attributes?.metadata?.name;

		if (
			( context === 'list-view' || context === 'breadcrumb' ) &&
			customName
		) {
			return customName;
		}

		if ( context === 'accessibility' ) {
			return attributes.customText;
		}
	},
	edit,
	save,
};

export const init = () => initBlock( { name, metadata, settings } );
