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
		const value = { text: '' }; // empty `RichTextValue`
		const screen = render(
			<ModalLinkUI isVisible value={ value } activeAttributes={ {} } />
		);
		expect( screen.toJSON() ).toMatchSnapshot();
	} );
} );
