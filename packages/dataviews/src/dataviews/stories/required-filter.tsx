/**
 * WordPress dependencies
 */
import { useState, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DataViews from '../index';
import { LAYOUT_TABLE } from '../../constants';
import filterSortAndPaginate from '../../utils/filter-sort-and-paginate';
import type { View, Field } from '../../types';
import { actions, data, fields, type SpaceObject } from './fixtures';

/**
 * Story demonstrating the differences between isPrimary, isRequired, and isLocked filters:
 *
 * - isPrimary: Field-level setting. Filter is always visible, can be changed and reset to empty.
 * - isRequired: View-level setting. Filter can be changed but cannot be removed or reset.
 * - isLocked: View-level setting. Filter is completely locked - no interaction at all.
 */
export const RequiredFilterComponent = ( {
	filterMode = 'all',
}: {
	filterMode?: 'isPrimary' | 'isRequired' | 'isLocked' | 'all';
} ) => {
	// Create modified fields with isPrimary on the 'type' field when needed
	const modifiedFields = useMemo( () => {
		const showPrimary = filterMode === 'isPrimary' || filterMode === 'all';

		return fields.map( ( field ): Field< SpaceObject > => {
			// Make 'isPlanet' a primary filter to demonstrate isPrimary behavior
			if ( field.id === 'isPlanet' && showPrimary ) {
				return {
					...field,
					filterBy: {
						operators: [ 'is' ],
						isPrimary: true,
					},
				};
			}
			return field;
		} );
	}, [ filterMode ] );

	const [ view, setView ] = useState< View >( () => {
		const filters: View[ 'filters' ] = [];

		if ( filterMode === 'isRequired' || filterMode === 'all' ) {
			filters.push( {
				field: 'type',
				operator: 'is',
				value: 'Satellite',
				isRequired: true,
			} );
		}

		if ( filterMode === 'isLocked' || filterMode === 'all' ) {
			filters.push( {
				field: 'categories',
				operator: 'isAny',
				value: [ 'Solar system' ],
				isLocked: true,
			} );
		}

		return {
			type: LAYOUT_TABLE,
			search: '',
			page: 1,
			perPage: 10,
			filters,
			fields: [ 'type', 'categories', 'satellites', 'isPlanet' ],
			titleField: 'title',
			descriptionField: 'description',
			mediaField: 'image',
		};
	} );

	// Reset view filters when filterMode changes
	const [ prevFilterMode, setPrevFilterMode ] = useState( filterMode );
	if ( prevFilterMode !== filterMode ) {
		setPrevFilterMode( filterMode );
		const filters: View[ 'filters' ] = [];

		if ( filterMode === 'isRequired' || filterMode === 'all' ) {
			filters.push( {
				field: 'type',
				operator: 'is',
				value: 'Satellite',
				isRequired: true,
			} );
		}

		if ( filterMode === 'isLocked' || filterMode === 'all' ) {
			filters.push( {
				field: 'categories',
				operator: 'isAny',
				value: [ 'Solar system' ],
				isLocked: true,
			} );
		}

		setView( ( prev ) => ( { ...prev, filters } ) );
	}

	const { data: shownData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( data, view, modifiedFields );
	}, [ view, modifiedFields ] );

	const showPrimary = filterMode === 'isPrimary' || filterMode === 'all';
	const showRequired = filterMode === 'isRequired' || filterMode === 'all';
	const showLocked = filterMode === 'isLocked' || filterMode === 'all';

	const cellStyle = {
		border: '1px solid #ccc',
		padding: '8px',
	};

	const headerCellStyle = {
		...cellStyle,
		textAlign: 'left' as const,
	};

	const centerCellStyle = {
		...cellStyle,
		textAlign: 'center' as const,
	};

	return (
		<div>
			<div
				style={ {
					marginBottom: '1rem',
					padding: '1rem',
					backgroundColor: '#f0f0f0',
					borderRadius: '4px',
				} }
			>
				<h3 style={ { marginTop: 0 } }>Filter Behavior Comparison</h3>
				<table
					style={ {
						width: '100%',
						borderCollapse: 'collapse',
						marginBottom: '1rem',
					} }
				>
					<thead>
						<tr>
							<th style={ headerCellStyle }>Property</th>
							<th style={ headerCellStyle }>Defined on</th>
							<th style={ centerCellStyle }>Always visible</th>
							<th style={ centerCellStyle }>Can interact</th>
							<th style={ centerCellStyle }>Can reset value</th>
							<th style={ centerCellStyle }>Can remove</th>
						</tr>
					</thead>
					<tbody>
						<tr
							style={
								showPrimary
									? { backgroundColor: '#e8f4e8' }
									: {}
							}
						>
							<td style={ cellStyle }>
								<code>isPrimary</code>
							</td>
							<td style={ cellStyle }>
								Field (<code>filterBy.isPrimary</code>)
							</td>
							<td style={ centerCellStyle }>Yes</td>
							<td style={ centerCellStyle }>Yes</td>
							<td style={ centerCellStyle }>
								<strong>Yes</strong>
							</td>
							<td style={ centerCellStyle }>No</td>
						</tr>
						<tr
							style={
								showRequired
									? { backgroundColor: '#e8f0f8' }
									: {}
							}
						>
							<td style={ cellStyle }>
								<code>isRequired</code>
							</td>
							<td style={ cellStyle }>
								View filter (<code>filters[].isRequired</code>)
							</td>
							<td style={ centerCellStyle }>Yes</td>
							<td style={ centerCellStyle }>Yes</td>
							<td style={ centerCellStyle }>No</td>
							<td style={ centerCellStyle }>No</td>
						</tr>
						<tr
							style={
								showLocked ? { backgroundColor: '#f8f0e8' } : {}
							}
						>
							<td style={ cellStyle }>
								<code>isLocked</code>
							</td>
							<td style={ cellStyle }>
								View filter (<code>filters[].isLocked</code>)
							</td>
							<td style={ centerCellStyle }>Yes</td>
							<td style={ centerCellStyle }>No</td>
							<td style={ centerCellStyle }>No</td>
							<td style={ centerCellStyle }>No</td>
						</tr>
					</tbody>
				</table>

				<p>
					<strong>Current mode:</strong> <code>{ filterMode }</code>
				</p>

				<h4>Active filters in this demo:</h4>
				<ul>
					{ showPrimary && (
						<li>
							<strong
								style={ {
									backgroundColor: '#e8f4e8',
									padding: '2px 6px',
								} }
							>
								Is Planet
							</strong>{ ' ' }
							- <code>isPrimary</code>: Always visible, can select
							a value and reset it (X button clears value but
							filter stays)
						</li>
					) }
					{ showRequired && (
						<li>
							<strong
								style={ {
									backgroundColor: '#e8f0f8',
									padding: '2px 6px',
								} }
							>
								Type is Satellite
							</strong>{ ' ' }
							- <code>isRequired</code>: Can change value, but no
							X button (cannot reset or remove)
						</li>
					) }
					{ showLocked && (
						<li>
							<strong
								style={ {
									backgroundColor: '#f8f0e8',
									padding: '2px 6px',
								} }
							>
								Categories is Solar system
							</strong>{ ' ' }
							- <code>isLocked</code>: Cannot click, no X button
							(completely read-only)
						</li>
					) }
				</ul>
			</div>
			<DataViews
				getItemId={ ( item ) => item.id.toString() }
				paginationInfo={ paginationInfo }
				data={ shownData }
				view={ view }
				fields={ modifiedFields }
				onChangeView={ setView }
				actions={ actions }
				isItemClickable={ () => false }
				defaultLayouts={ {
					[ LAYOUT_TABLE ]: {},
				} }
			/>
		</div>
	);
};

export default RequiredFilterComponent;
