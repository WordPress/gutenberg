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

const render = ( element, id ) =>
	AppRegistry.registerComponent( id, () => ( propsFromParent ) => {
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
