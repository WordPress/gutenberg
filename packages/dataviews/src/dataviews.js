/**
 * WordPress dependencies
 */
import {
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Pagination from './pagination';
import ViewActions from './view-actions';
import Filters from './filters';
import Search from './search';
import { VIEW_LAYOUTS, DATE_TYPE, ENUMERATION_TYPE } from './constants';
import { renderDate, renderEnumeration } from './types';

export default function DataViews( {
	view,
	onChangeView,
	fields,
	search = true,
	searchLabel = undefined,
	actions,
	data,
	getItemId,
	isLoading = false,
	paginationInfo,
	supportedLayouts,
	onSelectionChange,
	deferredRendering,
} ) {
	const [ selection, setSelection ] = useState( [] );

	const onSetSelection = ( items ) => {
		setSelection( items.map( ( item ) => item.id ) );
		onSelectionChange( items );
	};

	const ViewComponent = VIEW_LAYOUTS.find(
		( v ) => v.type === view.type
	).component;
	const _fields = useMemo( () => {
		return fields.map( ( field ) => {
			let render = field.render || field.getValue;
			if ( field.type === DATE_TYPE ) {
				render = ( { item } ) => renderDate( { field, item } );
			}
			if ( field.type === ENUMERATION_TYPE ) {
				render = ( { item } ) => renderEnumeration( { field, item } );
			}
			return {
				...field,
				render,
			};
		} );
	}, [ fields ] );

	return (
		<div className="dataviews-wrapper">
			<VStack spacing={ 0 } justify="flex-start">
				<HStack
					alignment="flex-start"
					className="dataviews__filters-view-actions"
				>
					<HStack justify="start" wrap>
						{ search && (
							<Search
								label={ searchLabel }
								view={ view }
								onChangeView={ onChangeView }
							/>
						) }
						<Filters
							fields={ _fields }
							view={ view }
							onChangeView={ onChangeView }
						/>
					</HStack>
					<ViewActions
						fields={ _fields }
						view={ view }
						onChangeView={ onChangeView }
						supportedLayouts={ supportedLayouts }
					/>
				</HStack>
				<ViewComponent
					fields={ _fields }
					view={ view }
					onChangeView={ onChangeView }
					paginationInfo={ paginationInfo }
					actions={ actions }
					data={ data }
					getItemId={ getItemId }
					isLoading={ isLoading }
					onSelectionChange={ onSetSelection }
					selection={ selection }
					deferredRendering={ deferredRendering }
				/>
				<Pagination
					view={ view }
					onChangeView={ onChangeView }
					paginationInfo={ paginationInfo }
				/>
			</VStack>
		</div>
	);
}
