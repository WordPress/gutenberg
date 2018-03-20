/** @format */

import React from 'react';
import App from './App';

import renderer from 'react-test-renderer';

it( 'renders without crashing', () => {
	const rendered = renderer.create( <App /> ).toJSON();
	expect( rendered ).toBeTruthy();
} );

it( "returns RN's View container and ", () => {
	const rendered = renderer.create( <App /> ).toJSON();
	expect( rendered.type ).toBe( 'View' ); // parent container
	expect( rendered.children[ 0 ].type ).toBe( 'View' ); // "Code" block
} );
