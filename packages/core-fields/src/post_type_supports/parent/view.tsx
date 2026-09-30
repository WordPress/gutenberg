import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import type { PostWithParent } from './types';
import { getTitleWithFallbackName } from './utils';

/*
 * A copy of the parent view of `@wordpress/fields`.
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

	return <>{ __( 'None' ) }</>;
};
