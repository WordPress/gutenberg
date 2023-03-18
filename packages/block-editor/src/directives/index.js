/**
 * WordPress dependencies
 */
import { registerDirective } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { BlockRoot } from '../components/block-root';

registerDirective(
	'block-root',
	function ( [ type, originalProps, ...children ], attributeName ) {
		const { [ attributeName ]: _, ...props } = originalProps;
		return [ BlockRoot, { ...props, as: type }, ...children ];
	}
);
