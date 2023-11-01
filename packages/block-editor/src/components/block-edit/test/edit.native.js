/**
 * External dependencies
 */
import { render } from 'test/helpers';
import { Text } from 'react-native';

/**
 * WordPress dependencies
 */
import {
	registerBlockType,
	unregisterBlockType,
	getBlockTypes,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { Edit } from '../edit';
import { BlockContextProvider } from '../../block-context';

describe( 'Edit', () => {
	afterEach( () => {
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	it( 'should return null if block type not defined', () => {
		const screen = render( <Edit name="core/test-block" /> );

		expect( screen.toJSON() ).toBe( null );
	} );

	it( 'should use edit implementation of block', () => {
		const edit = () => <Text>core/test-block</Text>;
		registerBlockType( 'core/test-block', {
			category: 'text',
			title: 'block title',
			edit,
		} );

		const screen = render( <Edit name="core/test-block" /> );

		expect( screen.getByText( 'core/test-block' ) ).toBeDefined();
	} );

	it( 'should assign context', () => {
		const edit = ( { context } ) => <Text>{ context.value }</Text>;
		registerBlockType( 'core/test-block', {
			category: 'text',
			title: 'block title',
			usesContext: [ 'value' ],
			edit,
		} );

		const screen = render(
			<BlockContextProvider value={ { value: 'Ok' } }>
				<Edit name="core/test-block" />
			</BlockContextProvider>
		);

		expect( screen.getByText( 'Ok' ) ).toBeDefined();
	} );
} );
