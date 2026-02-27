/**
 * WordPress dependencies
 */
import { useContext, useRef, useCallback, useEffect } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { funnel } from '@wordpress/icons';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { AddFilterMenu } from './add-filter';
import DataViewsContext from '../dataviews-context';
import type { View } from '../../types';

function FiltersToggle() {
	const {
		filters,
		view,
		onChangeView,
		setOpenedFilter,
		isShowingFilter,
		setIsShowingFilter,
	} = useContext( DataViewsContext );

	const buttonRef = useRef< HTMLButtonElement >( null );
	const onChangeViewWithFilterVisibility = useCallback(
		( _view: View ) => {
			onChangeView( _view );
			setIsShowingFilter( true );
		},
		[ onChangeView, setIsShowingFilter ]
	);
	const visibleFilters = filters.filter( ( filter ) => filter.isVisible );

	const hasVisibleFilters = !! visibleFilters.length;
	if ( filters.length === 0 ) {
		return null;
	}

	const addFilterButtonProps = {
		label: __( 'Add filter' ),
		'aria-expanded': false,
		isPressed: false,
	};
	const toggleFiltersButtonProps = {
		label: _x( 'Filter', 'verb' ),
		'aria-expanded': isShowingFilter,
		isPressed: isShowingFilter,
		onClick: () => {
			if ( ! isShowingFilter ) {
				setOpenedFilter( null );
			}
			setIsShowingFilter( ! isShowingFilter );
		},
	};
	const buttonComponent = (
		<Button
			ref={ buttonRef }
			className="dataviews-filters__visibility-toggle"
			size="compact"
			icon={ funnel }
			{ ...( hasVisibleFilters
				? toggleFiltersButtonProps
				: addFilterButtonProps ) }
		/>
	);
	return (
		<div className="dataviews-filters__container-visibility-toggle">
			{ ! hasVisibleFilters ? (
				<AddFilterMenu
					filters={ filters }
					view={ view }
					onChangeView={ onChangeViewWithFilterVisibility }
					setOpenedFilter={ setOpenedFilter }
					triggerProps={ { render: buttonComponent } }
				/>
			) : (
				<FilterVisibilityToggle
					buttonRef={ buttonRef }
					filtersCount={ view.filters?.length }
				>
					{ buttonComponent }
				</FilterVisibilityToggle>
			) }
		</div>
	);
}

function FilterVisibilityToggle( {
	buttonRef,
	filtersCount,
	children,
}: {
	buttonRef: React.RefObject< HTMLButtonElement | null >;
	filtersCount?: number;
	children: React.ReactNode;
} ) {
	// Focus the `add filter` button when unmounts.
	useEffect(
		() => () => {
			buttonRef.current?.focus();
		},
		[ buttonRef ]
	);
	return (
		<>
			{ children }
			{ !! filtersCount && (
				<span className="dataviews-filters-toggle__count">
					{ filtersCount }
				</span>
			) }
		</>
	);
}

export default FiltersToggle;
