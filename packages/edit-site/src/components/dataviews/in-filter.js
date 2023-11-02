/**
 * WordPress dependencies
 */
import {
	__experimentalInputControlPrefixWrapper as InputControlPrefixWrapper,
	SelectControl,
} from '@wordpress/components';

const OPERATOR_IN = 'in';

export default ( { filter, view, onChangeView } ) => {
	const activeValue = view.filters.find(
		( f ) => f.field === filter.id && f.operator === OPERATOR_IN
	)?.value;

	return (
		<SelectControl
			value={ activeValue }
			prefix={
				<InputControlPrefixWrapper
					as="span"
					className="dataviews__select-control-prefix"
				>
					{ filter.name + ':' }
				</InputControlPrefixWrapper>
			}
			options={ filter.elements }
			onChange={ ( value ) => {
				const filters = view.filters.filter(
					( f ) => f.field !== filter.id || f.operator !== OPERATOR_IN
				);
				if ( value !== '' ) {
					filters.push( {
						field: filter.id,
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
};
