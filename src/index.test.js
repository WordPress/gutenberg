
/** @format */

/**
 * External dependencies
 */
import renderer from 'react-test-renderer';

/**
 * WordPress dependencies
 */
import { dispatch, select } from '@wordpress/data';
import { BlockListBlock } from '@wordpress/block-editor';
import { initializeEditor } from '@wordpress/edit-post';

/**
 * Internal dependencies
 */
import { RootComponent } from './index';

describe( 'RootComponent', () => {
	beforeAll( initializeEditor );

	it( 'renders without crashing', () => {
		const app = renderer.create( <RootComponent /> );
		const rendered = app.toJSON();
		expect( rendered ).toBeTruthy();
		app.unmount();
	} );

	it( 'renders without crashing with a block focused', () => {
		const app = renderer.create( <RootComponent /> );
		const blocks = select( 'core/block-editor' ).getBlocks();

		// Methods that modify state are required to be called inside `act`
		renderer.act( () => {
			dispatch( 'core/block-editor' ).selectBlock( blocks[ 0 ].clientId );
		} );

		const rendered = app.toJSON();
		expect( rendered ).toBeTruthy();
		app.unmount();
	} );

	it( 'Code block is a TextInput', () => {
		const app = renderer.create( <RootComponent /> );

		app.root.findAllByType( BlockListBlock )
			.forEach( ( blockHolder ) => {
				if ( 'core/code' === blockHolder.props.name ) {
					// TODO: hardcoded indices are ugly and error prone. Can we do better here?
					const blockHolderContainer = blockHolder.children[ 0 ].children[ 0 ].children[ 0 ].children[ 0 ].children[ 0 ];
					const contentComponent = blockHolderContainer.children[ 0 ];
					const inputComponent =
						contentComponent.children[ 0 ].children[ 0 ].children[ 0 ].children[ 0 ].children[ 0 ]
							.children[ 0 ].children[ 0 ].children[ 0 ].children[ 0 ].children[ 0 ].children[ 0 ].children[ 0 ];

					expect( inputComponent.type ).toBe( 'TextInput' );
				}
			} );

		app.unmount();
	} );

	it( 'Heading block test', () => {
		const app = renderer.create( <RootComponent /> );
		app.root.findAllByType( BlockListBlock )
			.forEach( ( blockHolder ) => {
				if ( 'core/heading' === blockHolder.props.name ) {
					const aztec = blockHolder.findByType( 'RCTAztecView' );
					expect( aztec.props.text.text ).toBe( '<h2>What is Gutenberg?</h2>' );
				}
			} );
		app.unmount();
	} );
} );
