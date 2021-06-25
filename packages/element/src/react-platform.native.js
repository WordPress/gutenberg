/**
 * External dependencies
 */
import { AppRegistry } from 'react-native';
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { applyFilters, doAction } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { cloneElement } from './react';

const registeredComponents = {};

const render = ( element, id ) =>
	AppRegistry.registerComponent( id, () => ( propsFromParent ) => {
		// This callback can be called multiple times in development when a warning or error
		// is triggered when executing code below so we have to prevent it.
		// Reference: https://github.com/WordPress/gutenberg/issues/32882#issuecomment-868414379
		// eslint-disable-next-line no-undef
		if ( __DEV__ ) {
			if ( registeredComponents[ id ] ) {
				return;
			}
			registeredComponents[ id ] = true;
		}

		const parentProps = omit( propsFromParent || {}, [ 'rootTag' ] );

		doAction( 'native.pre-render', parentProps );

		const filteredProps = applyFilters(
			'native.block_editor_props',
			parentProps
		);

		doAction( 'native.render', filteredProps );

		return cloneElement( element, filteredProps );
	} );

/**
 * Render a given element on Native.
 * This actually returns a componentProvider that can be registered with `AppRegistry.registerComponent`
 *
 * @param {WPElement} element Element to render.
 */
export { render };
