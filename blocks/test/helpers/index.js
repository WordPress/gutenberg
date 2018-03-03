/**
 * External dependencie
 */
import { render } from 'enzyme';
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import {
	createBlock,
	getBlockType,
	registerBlockType,
	unregisterBlockType,
	BlockEdit,
} from '../..';

export const blockEditRender = ( name, settings ) => {
	if ( ! getBlockType( name ) ) {
		registerBlockType( name, settings );
	}
	const block = createBlock( name );

	return render(
		<BlockEdit
			name={ name }
			isSelected={ false }
			attributes={ block.attributes }
			setAttributes={ noop }
		/>
	);
};

/**
 * Given an block name and superset of settings, registers a block type for the
 * duration of the test lifecycle. Provides sensible defaults for settings.
 *
 * @param {string} name     Block name.
 * @param {Object} settings Block settings.
 *
 * @return {Function} A test describe block.
 */
export function withRegisteredBlockType( name, settings ) {
	return ( cases ) => {
		describe( `withRegisteredBlockType( ${ name } )`, () => {
			beforeAll( () => {
				registerBlockType( name, {
					title: 'Test Block',
					category: 'common',
					save: () => null,
					...settings,
				} );
			} );

			afterAll( () => {
				unregisterBlockType( name );
			} );

			cases();
		} );
	};
}
