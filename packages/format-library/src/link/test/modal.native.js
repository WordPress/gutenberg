/**
 * Internal dependencies
 */
import ModalLinkUI from '../modal';
/**
 * External dependencies
 */
import { render } from 'test/helpers';

describe( 'LinksUI', () => {
	it( 'LinksUI renders', () => {
		const screen = render( <ModalLinkUI /> );
		expect( screen.container ).toBeTruthy();
	} );
} );
