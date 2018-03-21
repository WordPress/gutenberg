/** @format */

import React from 'react';
import App from './App';
import BlockHolder from './block-management/block-holder';

import renderer from 'react-test-renderer';

it( 'renders without crashing', () => {
	const rendered = renderer.create( <App /> ).toJSON();
	expect( rendered ).toBeTruthy();
} );

it( 'Code block is a TextInput', () => {
	renderer
		.create( <App /> )
		.root.findAllByType( BlockHolder )
		.forEach( blockHolder => {
			if ( blockHolder.props.blockType === 'code' ) {
				// TODO: hardcoded indices are ugly and error prone. Can we do better here?
				const blockHolderContainer = blockHolder.children[ 0 ].children[ 0 ].children[ 0 ];
				const contentComponent = blockHolderContainer.children[ 1 ];
				const inputComponent =
					contentComponent.children[ 0 ].children[ 0 ].children[ 0 ].children[ 0 ].children[ 0 ]
						.children[ 0 ].children[ 0 ];
				expect( inputComponent.type ).toBe( 'TextInput' );
			}
		} );
} );
