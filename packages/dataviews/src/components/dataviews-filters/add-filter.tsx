import type { Ref } from 'react';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { forwardRef } from '@wordpress/element';
// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
import { Menu } from '@wordpress/ui';
import type { NormalizedFilter, View } from '../../types';

interface AddFilterProps {
	filters: NormalizedFilter[];
	view: View;
	onChangeView: ( view: View ) => void;
	setOpenedFilter: ( filter: string | null ) => void;
}

export function AddFilterMenu( {
	filters,
	view,
	onChangeView,
	setOpenedFilter,
	triggerProps,
}: AddFilterProps & {
	triggerProps: React.ComponentProps< typeof Menu.Trigger >;
} ) {
	const inactiveFilters = filters.filter( ( filter ) => ! filter.isVisible );
	return (
		// The `disabled` prop on `Menu.Root` (rather than on the trigger)
		// keeps the menu from opening while letting the trigger button stay
		// focusable via its own `accessibleWhenDisabled`.
		<Menu.Root disabled={ ! inactiveFilters.length }>
			<Menu.Trigger { ...triggerProps } />
			<Menu.Popup>
				{ inactiveFilters.map( ( filter ) => {
					return (
						<Menu.Item
							key={ filter.field }
							onClick={ () => {
								setOpenedFilter( filter.field );
								onChangeView( {
									...view,
									page: 1,
									filters: [
										...( view.filters || [] ),
										{
											field: filter.field,
											value: undefined,
											operator: filter.operators[ 0 ],
										},
									],
								} );
							} }
						>
							<Menu.ItemLabel>{ filter.name }</Menu.ItemLabel>
						</Menu.Item>
					);
				} ) }
			</Menu.Popup>
		</Menu.Root>
	);
}

function AddFilter(
	{ filters, view, onChangeView, setOpenedFilter }: AddFilterProps,
	ref: Ref< HTMLButtonElement >
) {
	if ( ! filters.length || filters.every( ( { isPrimary } ) => isPrimary ) ) {
		return null;
	}
	const inactiveFilters = filters.filter( ( filter ) => ! filter.isVisible );
	return (
		<AddFilterMenu
			triggerProps={ {
				render: (
					<Button
						accessibleWhenDisabled
						size="compact"
						className="dataviews-filters-button"
						variant="tertiary"
						disabled={ ! inactiveFilters.length }
						ref={ ref }
					/>
				),
				children: __( 'Add filter' ),
			} }
			{ ...{ filters, view, onChangeView, setOpenedFilter } }
		/>
	);
}

export default forwardRef( AddFilter );
