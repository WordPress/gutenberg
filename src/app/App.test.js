/** @format */

import renderer from 'react-test-renderer';

import App from './App';
import BlockHolder from '../block-management/block-holder';
import { dispatch, select } from '@wordpress/data';

describe( 'App', () => {
	it( 'renders without crashing', () => {
		const app = renderer.create( <App /> );
		const rendered = app.toJSON();
		expect( rendered ).toBeTruthy();
	} );

	it( 'renders without crashing with a block focused', () => {
		const app = renderer.create( <App /> );
		const blocks = select( 'core/editor' ).getBlocks();
		dispatch( 'core/editor' ).selectBlock( blocks[ 0 ].clientId );
		const rendered = app.toJSON();
		expect( rendered ).toBeTruthy();
	} );

	it( 'Code block is a TextInput', () => {
		renderer
			.create( <App /> )
			.root.findAllByType( BlockHolder )
			.forEach( ( blockHolder ) => {
				if ( 'core/code' === blockHolder.props.name ) {
					// TODO: hardcoded indices are ugly and error prone. Can we do better here?
					const blockHolderContainer = blockHolder.children[ 0 ].children[ 0 ].children[ 0 ];
					const contentComponent = blockHolderContainer.children[ 0 ];
					const inputComponent =
						contentComponent.children[ 0 ].children[ 0 ].children[ 0 ].children[ 0 ].children[ 0 ]
							.children[ 0 ].children[ 0 ].children[ 0 ].children[ 0 ].children[ 0 ];
					expect( inputComponent.type ).toBe( 'TextInput' );
				}
			} );
	} );

	it( 'Heading block test', () => {
		renderer
			.create( <App /> )
			.root.findAllByType( BlockHolder )
			.forEach( ( blockHolder ) => {
				if ( 'core/heading' === blockHolder.props.name ) {
					const aztec = blockHolder.findByType( 'RCTAztecView' );
					expect( aztec.props.text.text ).toBe( '<h2>Welcome to Gutenberg</h2>' );
				}
			} );
	} );
} );
