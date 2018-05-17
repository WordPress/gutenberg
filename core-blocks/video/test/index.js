/**
 * External dependencies
 */
import { get, mapValues } from 'lodash';

/**
 * Internal dependencies
 */
import { name, definition, implementation } from '../';
import { blockEditRender } from '../../test/helpers';

describe( 'core/video', () => {
	test( 'block edit matches snapshot', () => {
		const settings = {
			...definition,
			...implementation,
			attributes: mapValues( definition.attributes, ( attribute, key ) => {
				const implementationAttribute = get( implementation.attributes, [ key ], {} );
				return {
					...attribute,
					...implementationAttribute,
				};
			} ),
		};
		const wrapper = blockEditRender( name, settings );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
