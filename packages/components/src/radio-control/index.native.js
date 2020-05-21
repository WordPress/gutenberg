/**
 * Internal dependencies
 */
import RadioCell from '../mobile/bottom-sheet/radio-cell';

function RadioControl( {
	help,
	instanceId,
	className,
	onChange,
	selected,
	options = [],
	...props
} ) {
	const id = `inspector-radio-control-${ instanceId }`;

	return (
		<>
			{ options.map( ( option, index ) => {
				return (
					<RadioCell
						label={ option.label }
						id={ id }
						help={ help }
						className={ className }
						aria-describedby={ !! help ? id + '__help' : undefined }
						onPress={ () => onChange( option.value ) }
						selected={ option.value === selected }
						key={ `${ option.value }-${ index }` }
						separatorType={ 'fullWidth' }
						{ ...props }
					/>
				);
			} ) }
		</>
	);
}

export default RadioControl;
