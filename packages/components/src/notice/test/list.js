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
import NoticeList from '../list';

describe( 'NoticeList', () => {
	it( 'should merge className', () => {
		const renderer = new ShallowRenderer();

		renderer.render( <NoticeList notices={ [] } className="is-ok" /> );

		const classes = new TokenList(
			renderer.getRenderOutput().props.className
		);
		expect( classes.contains( 'is-ok' ) ).toBe( true );
		expect( classes.contains( 'components-notice-list' ) ).toBe( true );
	} );
} );
