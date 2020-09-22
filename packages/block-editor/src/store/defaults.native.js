/**
 * Internal dependencies
 */
import {
	PREFERENCES_DEFAULTS,
	SETTINGS_DEFAULTS as SETTINGS,
} from './defaults.js';

/**
  * WordPress dependencies
*/
import { _x } from '@wordpress/i18n';

const SETTINGS_DEFAULTS = {
	...SETTINGS,
	alignWide: true,
	fontSizes: [		
		{		
			name: _x( 'Small', 'font size name' ),		
			size: 13,		
			slug: 'small',		
		},		
		{		
			name: _x( 'Normal', 'font size name' ),		
			size: 16,		
			slug: 'normal',		
		},		
		{		
			name: _x( 'Medium', 'font size name' ),		
			size: 20,		
			slug: 'medium',		
		},		
		{		
			name: _x( 'Large', 'font size name' ),		
			size: 36,		
			slug: 'large',		
		},		
		{		
			name: _x( 'Huge', 'font size name' ),		
			size: 42,		
			slug: 'huge',		
		},		
	],
};

export { PREFERENCES_DEFAULTS, SETTINGS_DEFAULTS };
