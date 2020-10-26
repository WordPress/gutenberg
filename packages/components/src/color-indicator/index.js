/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { StyledColorIndicator } from './styles/color-indicator-styles';

const ColorIndicator = ( { className, colorValue, ...props } ) => (
	<StyledColorIndicator
		className={ classnames( 'component-color-indicator', className ) }
		style={ { background: colorValue } }
		{ ...props }
	/>
);

export default ColorIndicator;
