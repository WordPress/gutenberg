/**
 * External dependencies
 */
import ShallowRenderer from 'react-test-renderer/shallow';

/**
 * WordPress dependencies
 */
import TokenList from '@wordpress/token-list';

/**
 * Internal dependencies
 */
import Notice from '../index';

describe( 'Notice', () => {
	it( 'should match snapshot', () => {
		const renderer = new ShallowRenderer();

		renderer.render(
			<Notice
				status="success"
				actions={ [
					{ label: 'View', url: 'https://example.com' },
				] }
			>
				Example
			</Notice>
		);

		expect( renderer.getRenderOutput() ).toMatchSnapshot();
	} );

	it( 'should not have is-dismissible class when isDismissible prop is false', () => {
		const renderer = new ShallowRenderer();

		renderer.render( <Notice isDismissible={ false } /> );

		const classes = new TokenList( renderer.getRenderOutput().props.className );
		expect( classes.contains( 'components-notice' ) ).toBe( true );
		expect( classes.contains( 'is-dismissible' ) ).toBe( false );
	} );
} );
