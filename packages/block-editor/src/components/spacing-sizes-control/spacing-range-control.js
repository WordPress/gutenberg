/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { RangeControl } from '@wordpress/components';

/**
 * Inspector control panel containing the spacing size related configuration
 *
 * @param {Object} props
 *
 * @return {WPElement} Font size edit element.
 */
export default function SpacingRangeControl( props ) {
	const [ valueNow, setValueNow ] = useState( null );
	const customTooltipContent = ( value ) => props.spacingSizes[ value ].name;

	return (
		<RangeControl
			values={ props.value }
			label={ props.label }
			sides={ props.sides }
			allowReset={ false }
			splitOnAxis={ props.splitOnAxis }
			onChange={ ( newSize ) => {
				setValueNow( newSize );
				props.onChange(
					`var:preset|spacing|${ props.spacingSizes[ newSize ].slug }`
				);
			} }
			withInputField={ false }
			aria-valuenow={ valueNow }
			aria-valuetext={ props.spacingSizes[ valueNow ]?.name }
			renderTooltipContent={ customTooltipContent }
			min={ 0 }
			max={ props.spacingSizes.length - 1 }
		/>
	);
}
