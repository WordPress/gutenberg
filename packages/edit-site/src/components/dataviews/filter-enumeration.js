/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { OPERATOR_IN } from './constants';

const { DropdownMenuCheckboxItemV2: DropdownMenuCheckboxItem } = unlock(
	componentsPrivateApis
);

export default function ( { filter, view, onChangeView } ) {
	const filterInView = view.filters.find( ( f ) => f.field === filter.field );
	const activeElement = filter.elements.find(
		( element ) => element.value === filterInView?.value
	);

	return filter.elements.map( ( element ) => {
		return (
			<DropdownMenuCheckboxItem
				key={ element.value }
				value={ element.value }
				checked={ activeElement?.value === element.value }
				onSelect={ () =>
					onChangeView( ( currentView ) => ( {
						...currentView,
						page: 1,
						filters: [
							...view.filters.filter(
								( f ) => f.field !== filter.field
							),
							{
								field: filter.field,
								operator: OPERATOR_IN,
								value:
									activeElement?.value === element.value
										? undefined
										: element.value,
							},
						],
					} ) )
				}
			>
				{ element.label }
			</DropdownMenuCheckboxItem>
		);
	} );
}
