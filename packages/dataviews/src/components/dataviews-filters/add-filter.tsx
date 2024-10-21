/**
 * External dependencies
 */
import type { Ref } from 'react';

/**
 * WordPress dependencies
 */
import {
	privateApis as componentsPrivateApis,
	Button,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import type { NormalizedFilter, View } from '../../types';

const { Menu } = unlock( componentsPrivateApis );

interface AddFilterProps {
	filters: NormalizedFilter[];
	view: View;
	onChangeView: ( view: View ) => void;
	setOpenedFilter: ( filter: string | null ) => void;
}

export function AddFilterDropdownMenu( {
	filters,
	view,
	onChangeView,
	setOpenedFilter,
	trigger,
}: AddFilterProps & {
	trigger: React.ReactNode;
} ) {
	const inactiveFilters = filters.filter( ( filter ) => ! filter.isVisible );
	return (
		<Menu trigger={ trigger }>
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
		</Menu>
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
		<AddFilterDropdownMenu
			trigger={
				<Button
					accessibleWhenDisabled
					size="compact"
					className="dataviews-filters-button"
					variant="tertiary"
					disabled={ ! inactiveFilters.length }
					ref={ ref }
				>
					{ __( 'Add filter' ) }
				</Button>
			}
			{ ...{ filters, view, onChangeView, setOpenedFilter } }
		/>
	);
}

export default forwardRef( AddFilter );
