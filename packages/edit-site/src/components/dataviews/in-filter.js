/**
 * WordPress dependencies
 */
import {
	__experimentalInputControlPrefixWrapper as InputControlPrefixWrapper,
	SelectControl,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

export const OPERATOR_IN = 'in';

export default ( { filter, view, onChangeView } ) => {
	const valueFound = view.filters.find(
		( f ) => f.field === filter.field && f.operator === OPERATOR_IN
	);

	const activeValue =
		! valueFound || ! valueFound.hasOwnProperty( 'value' )
			? ''
			: valueFound.value;

	const id = `dataviews__filters-in-${ filter.field }`;

	return (
		<SelectControl
			id={ id }
			__nextHasNoMarginBottom
			value={ activeValue }
			prefix={
				<InputControlPrefixWrapper
					as="label"
					htmlFor={ id }
					className="dataviews__select-control-prefix"
				>
					{ sprintf(
						/* translators: filter name. */
						__( '%s:' ),
						filter.name
					) }
				</InputControlPrefixWrapper>
			}
			options={ filter.elements }
			onChange={ ( value ) => {
				const filters = view.filters.filter(
					( f ) =>
						f.field !== filter.field || f.operator !== OPERATOR_IN
				);

				filters.push( {
					field: filter.field,
					operator: OPERATOR_IN,
					value,
				} );

				onChangeView( ( currentView ) => ( {
					...currentView,
					page: 1,
					filters,
				} ) );
			} }
		/>
	);
};
