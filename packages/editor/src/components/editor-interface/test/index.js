/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import EditorInterfaceNotices from '../notices';

jest.mock( '@wordpress/notices', () => {
	const { createElement } = require( '@wordpress/element' );

	return {
		InlineNotices: ( { children } ) =>
			createElement(
				'div',
				{ 'data-testid': 'editor-interface-notices' },
				children
			),
	};
} );

jest.mock( '../../template-validation-notice', () => {
	const { createElement } = require( '@wordpress/element' );

	return function MockTemplateValidationNotice() {
		return createElement( 'div', null, 'Template validation notice mount' );
	};
} );

jest.mock( '../../distributed-editing-status', () => {
	const { createElement } = require( '@wordpress/element' );

	return function MockDistributedEditingStatus() {
		return createElement( 'div', null, 'Distributed editing status mount' );
	};
} );

describe( 'EditorInterfaceNotices', () => {
	it( 'mounts distributed editing status with existing editor notices', () => {
		render( <EditorInterfaceNotices /> );

		expect(
			screen.getByTestId( 'editor-interface-notices' )
		).toBeInTheDocument();
		expect(
			screen.getByText( 'Template validation notice mount' )
		).toBeVisible();
		expect(
			screen.getByText( 'Distributed editing status mount' )
		).toBeVisible();
	} );
} );
