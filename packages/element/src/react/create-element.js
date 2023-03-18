/**
 * External dependencies
 */
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { createElement as createElementReact } from 'react';

/**
 * Internal dependencies
 */
import { directives } from '../directives';

export function createElement( type, props, ...children ) {
	// Limiting the application of directives to components with props.
	if ( ! props || props.length === 0 ) {
		return createElementReact( type, props, ...children );
	}

	for ( const [ attributeName, directiveHandler ] of directives ) {
		if ( attributeName in props ) {
			[ type, props, ...children ] = directiveHandler(
				[ type, props, ...children ],
				attributeName
			);
		}
	}

	return createElementReact( type, props, ...children );
}
