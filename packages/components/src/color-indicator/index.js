/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import './style.scss';

const ColorIndicator = ( { className, colorValue, ...props } ) => (
	<span
		className={ classnames( 'component-color-indicator', className ) }
		style={ { background: colorValue } }
		{ ...props }
	/>
);

export default ColorIndicator;
