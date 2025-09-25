/**
 * WordPress dependencies
 */
import { memo, useContext, useRef } from '@wordpress/element';
import { __experimentalHStack as HStack } from '@wordpress/components';

/**
 * Internal dependencies
 */
import Filter from './filter';
import { default as AddFilter } from './add-filter';
import ResetFilters from './reset-filters';
import useFilters from './use-filters';
import DataViewsContext from '../dataviews-context';

function Filters( { className }: { className?: string } ) {
	const { fields, view, onChangeView, openedFilter, setOpenedFilter } =
		useContext( DataViewsContext );
	const addFilterRef = useRef< HTMLButtonElement >( null );
	const filters = useFilters( fields, view );
	const addFilter = (
		<AddFilter
			key="add-filter"
			filters={ filters }
			view={ view }
			onChangeView={ onChangeView }
			ref={ addFilterRef }
			setOpenedFilter={ setOpenedFilter }
		/>
	);
	const visibleFilters = filters.filter( ( filter ) => filter.isVisible );
	if ( visibleFilters.length === 0 ) {
		return null;
	}
	const filterComponents = [
		...visibleFilters.map( ( filter ) => {
			return (
				<Filter
					key={ filter.field }
					filter={ filter }
					view={ view }
					fields={ fields }
					onChangeView={ onChangeView }
					addFilterRef={ addFilterRef }
					openedFilter={ openedFilter }
				/>
			);
		} ),
		addFilter,
	];

	filterComponents.push(
		<ResetFilters
			key="reset-filters"
			filters={ filters }
			view={ view }
			onChangeView={ onChangeView }
		/>
	);

	return (
		<HStack
			justify="flex-start"
			style={ { width: 'fit-content' } }
			wrap
			className={ className }
		>
			{ filterComponents }
		</HStack>
	);
}

export default memo( Filters );
