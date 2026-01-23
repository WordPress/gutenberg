/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import type { DataViewRenderFieldProps } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { BasePost } from '../../types';
import { getTitleWithFallbackName } from './utils';

export const ParentView = ( {
	item,
}: DataViewRenderFieldProps< BasePost > ) => {
	const parent = useSelect(
		( select ) => {
			const { getEntityRecord } = select( coreStore );
			return item?.parent
				? getEntityRecord( 'postType', item.type, item.parent )
				: null;
		},
		[ item.parent, item.type ]
	);

	if ( parent ) {
		return <>{ getTitleWithFallbackName( parent ) }</>;
	}

	return <>{ __( 'None' ) }</>;
};
