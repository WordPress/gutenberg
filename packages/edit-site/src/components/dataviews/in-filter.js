/**
 * WordPress dependencies
 */
import {
	__experimentalInputControlPrefixWrapper as InputControlPrefixWrapper,
	SelectControl,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';

export const OPERATOR_IN = 'in';

export default function InFilter( { filter, view, onChangeView } ) {
	const valueFound = view.filters.find(
		( f ) => f.field === filter.field && f.operator === OPERATOR_IN
	);

	const activeValue =
		! valueFound || ! valueFound.hasOwnProperty( 'value' )
			? ''
			: valueFound.value;

	const id = useInstanceId( InFilter, 'dataviews__filters-in' );

	return (
		<SelectControl
			id={ id }
			value={ activeValue }
			prefix={
				<InputControlPrefixWrapper
					as="label"
					htmlFor={ id }
					className="dataviews__select-control-prefix"
				>
					{ filter.name + ':' }
				</InputControlPrefixWrapper>
			}
			options={ filter.elements }
			onChange={ ( value ) => {
				const filters = view.filters.filter(
					( f ) =>
						f.field !== filter.field || f.operator !== OPERATOR_IN
				);
				if ( value !== '' ) {
					filters.push( {
						field: filter.field,
						operator: OPERATOR_IN,
						value,
					} );
				}

				onChangeView( ( currentView ) => ( {
					...currentView,
					page: 1,
					filters,
				} ) );
			} }
		/>
	);
}
