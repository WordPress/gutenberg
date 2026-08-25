/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';
import save from './save';
import transforms from './transforms';
import figureIcon from './icon';
import variations from './variations';

const { name } = metadata;
export { metadata, name };

export const settings = {
	__experimentalLabel( attributes ) {
		const { caption } = attributes;

		if ( ! caption ) {
			return __( 'Figure' );
		}

		const plainTextCaption = caption.replace( /<[^>]+>/g, '' ).trim();

		if ( plainTextCaption ) {
			/* translators: %s: caption text */
			return sprintf( __( 'Figure: %s' ), plainTextCaption );
		}

		return __( 'Figure' );
	},
	variations,
	edit,
	save,
	transforms,
	icon: figureIcon,
};

export const init = () => initBlock( { name, metadata, settings } );
