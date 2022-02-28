/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import SeparatorEdit from '../edit';

jest.mock( '@wordpress/block-editor', () => ( {
	...jest.requireActual( '@wordpress/block-editor' ),
	useBlockProps: jest.fn(),
} ) );

const defaultAttributes = {
	backgroundColor: undefined,
	opacity: 'alpha-channel',
	style: {},
	className: '',
};
const defaultProps = {
	attributes: defaultAttributes,
	setAttributes: jest.fn(),
};

describe( 'Separator block edit method', () => {
	beforeEach( () => {
		useBlockProps.mockClear();
	} );

	test( 'should call useBlockProps with has-alpha-channel-opacity class and no inline styles by default', () => {
		render( <SeparatorEdit { ...defaultProps } /> );
		expect( useBlockProps ).toHaveBeenCalledWith( {
			className: 'has-alpha-channel-opacity',
			style: undefined,
		} );
	} );
} );
