/**
 * External dependencies
 */
import TestRenderer from 'react-test-renderer';

/**
 * WordPress dependencies
 */
import { Notice } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { InlineTip } from '../';

describe( 'InlineTip', () => {
	it( 'should not render anything if invisible', () => {
		const renderer = TestRenderer.create(
			<InlineTip isVisible={ false }>
				It looks like you’re writing a letter. Would you like help?
			</InlineTip>
		);
		expect( renderer.root.children ).toHaveLength( 0 );
	} );

	it( 'should render correctly', () => {
		const renderer = TestRenderer.create(
			<InlineTip isVisible>
				It looks like you’re writing a letter. Would you like help?
			</InlineTip>
		);
		expect( renderer ).toMatchSnapshot();
	} );

	it( 'should call onRemove when the remove button is clicked', () => {
		const onRemove = jest.fn();
		const renderer = TestRenderer.create(
			<InlineTip isVisible onRemove={ onRemove }>
				It looks like you’re writing a letter. Would you like help?
			</InlineTip>
		);
		renderer.root.findByType( Notice ).props.onRemove();
		expect( onRemove ).toHaveBeenCalled();
	} );
} );
