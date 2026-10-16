import { __ } from '@wordpress/i18n';
import type { BasePost } from '../../types';
import { getSlug } from './utils';

const SlugView = ( { item }: { item: BasePost } ) => {
	// A draft without a slug or a title has no slug yet.
	return getSlug( item ) || __( 'None' );
};

export default SlugView;
