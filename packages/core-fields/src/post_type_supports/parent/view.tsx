import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import type { PostWithParent } from './types';
import { getTitleWithFallbackName } from './utils';

/*
 * The title of the parent of a post.
 */
export const ParentView = ( { item }: { item: PostWithParent } ) => {
	const parent = useSelect(
		( select ) => {
			const { getEntityRecord } = select( coreStore );
			return item?.parent
				? getEntityRecord< PostWithParent >(
						'postType',
						item.type,
						item.parent
					)
				: null;
		},
		[ item.parent, item.type ]
	);

	if ( parent ) {
		return <>{ getTitleWithFallbackName( parent ) }</>;
	}

	// Several posts edited at once show nothing until a parent is picked.
	if ( item?.parent === undefined ) {
		return null;
	}

	return <>{ __( 'None' ) }</>;
};
