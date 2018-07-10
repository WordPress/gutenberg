/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import './style.scss';

const ColorIndicator = ( { ariaLabel, colorValue, className } ) => (
	<span
		className={ classnames( 'component-color-indicator', className ) }
		aria-label={ ariaLabel }
		style={ { background: colorValue } }
	/>
);

export default ColorIndicator;
