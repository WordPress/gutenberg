/**
 * External dependencies
 */
import { render } from 'enzyme';

/**
 * Internal dependencies
 */
import { getEmbedEditComponent } from '../edit';

describe( 'core/embed', () => {
	test( 'block edit matches snapshot', () => {
		const EmbedEdit = getEmbedEditComponent( 'Embed', 'embed-generic' );
		const wrapper = render( <EmbedEdit attributes={ {} } /> );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
