/**
 * Internal dependencies
 */
import RadioCell from '../mobile/bottom-sheet/radio-cell';

function RadioControl( { onChange, selected, options = [], ...props } ) {
	return (
		<>
			{ options.map( ( option, index ) => {
				return (
					<RadioCell
						label={ option.label }
						onPress={ () => onChange( option.value ) }
						selected={ option.value === selected }
						key={ `${ option.value }-${ index }` }
						{ ...props }
					/>
				);
			} ) }
		</>
	);
}

export default RadioControl;
