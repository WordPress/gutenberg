import { __ } from '@wordpress/i18n';
import { SelectControl, useEnableWpCompatOverlaySlot } from '@wordpress/ui';
import type { QueryControlsProps } from './types';

type OrderBySelectProps = Pick< QueryControlsProps, 'order' | 'orderBy' > &
	Required<
		Pick<
			QueryControlsProps,
			'onOrderChange' | 'onOrderByChange' | 'orderByOptions'
		>
	>;

export default function OrderBySelect( {
	order,
	orderBy,
	orderByOptions,
	onOrderChange,
	onOrderByChange,
}: OrderBySelectProps ) {
	// Preserve popup stacking inside legacy overlays in directly bundled apps.
	useEnableWpCompatOverlaySlot();

	const sortValue =
		orderBy === undefined || order === undefined
			? null
			: `${ orderBy }/${ order }`;
	const selectedOption =
		orderByOptions.find( ( option ) => option.value === sortValue ) ?? null;

	return (
		<SelectControl
			label={ __( 'Order by' ) }
			items={ orderByOptions }
			value={ selectedOption }
			onValueChange={ ( item ) => {
				if ( typeof item?.value !== 'string' ) {
					return;
				}

				const [ newOrderBy, newOrder ] = item.value.split( '/' );
				if ( newOrder !== order ) {
					onOrderChange(
						newOrder as NonNullable< QueryControlsProps[ 'order' ] >
					);
				}
				if ( newOrderBy !== orderBy ) {
					onOrderByChange(
						newOrderBy as NonNullable<
							QueryControlsProps[ 'orderBy' ]
						>
					);
				}
			} }
		/>
	);
}
