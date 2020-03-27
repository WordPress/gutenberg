/**
 * External dependencies
 */
import { render, unmountComponentAtNode } from 'react-dom';
import { act } from 'react-dom/test-utils';

/**
 * Internal dependencies
 */
import AlignmentMatrixControl from '../';

let container = null;

beforeEach( () => {
	container = document.createElement( 'div' );
	document.body.appendChild( container );
} );

afterEach( () => {
	unmountComponentAtNode( container );
	container.remove();
	container = null;
} );

const getControl = () => {
	return container.querySelector( '.component-alignment-matrix-control' );
};

describe( 'AlignmentMatrixControl', () => {
	describe( 'Basic rendering', () => {
		it( 'should render', () => {
			act( () => {
				render( <AlignmentMatrixControl />, container );
			} );
			const control = getControl();

			expect( control ).toBeTruthy();
		} );
	} );
} );
