/**
 * External dependencies
 */
import { isArray } from 'lodash';

/**
 * Internal dependencies
 */
import ColorIndicator from '../color-indicator';

const mapColorIndicator = ( settings, index ) => (
	<ColorIndicator
		key={ index }
		colorValue={ settings.value }
		ariaLabel={ settings.colorIndicatorAriaLabel }
	/>
);

const TextWithColorIndicators = ( { className, colorSettings, children } ) => (
	<span className={ className }>
		{ children }
		{ !! colorSettings && isArray( colorSettings ) ?
			colorSettings.map( mapColorIndicator ) :
			mapColorIndicator( colorSettings )
		}
	</span>
);

export default TextWithColorIndicators;
