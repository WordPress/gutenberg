/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { PageAttributesCheck } from '../check';

describe( 'PageAttributesCheck', () => {
	const postType = {
		data: {
			supports: {
				'page-attributes': true,
			},
		},
	};

	it( 'should not render anything if unknown page attributes support', () => {
		const wrapper = shallow( <PageAttributesCheck postType={ {} }>content</PageAttributesCheck> );

		expect( wrapper.type() ).toBe( null );
	} );

	it( 'should not render anything if no page attributes support', () => {
		const wrapper = shallow(
			<PageAttributesCheck postType={ {
				data: {
					supports: {
						'page-attributes': false,
					},
				},
			} }>
				content
			</PageAttributesCheck>
		);

		expect( wrapper.type() ).toBe( null );
	} );

	it( 'should render if page attributes support', () => {
		const wrapper = shallow( <PageAttributesCheck postType={ postType }>content</PageAttributesCheck> );

		expect( wrapper.type() ).not.toBe( null );
	} );
} );
