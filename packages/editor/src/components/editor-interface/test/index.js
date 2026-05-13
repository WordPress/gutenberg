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

	function MockDistributedEditingStatus() {
		return createElement( 'div', null, 'Distributed editing status mount' );
	}

	function MockDistributedEditingStatusInspector() {
		return createElement(
			'div',
			null,
			'Distributed editing status inspector mount'
		);
	}

	return {
		__esModule: true,
		default: MockDistributedEditingStatus,
		DistributedEditingStatusInspector:
			MockDistributedEditingStatusInspector,
	};
} );

afterEach( () => {
	delete globalThis.__experimentalDistributedEditingStatusInspector;
	window.history.pushState( {}, '', '/' );
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
		expect(
			screen.queryByText( 'Distributed editing status inspector mount' )
		).not.toBeInTheDocument();
	} );

	it( 'mounts distributed editing inspector behind the manual browser flag', () => {
		globalThis.__experimentalDistributedEditingStatusInspector = true;

		render( <EditorInterfaceNotices /> );

		expect(
			screen.getByText( 'Distributed editing status inspector mount' )
		).toBeVisible();
	} );

	it( 'mounts distributed editing inspector behind the development URL flag', () => {
		window.history.pushState( {}, '', '/?de-rtc-inspector=1' );

		render( <EditorInterfaceNotices /> );

		expect(
			screen.getByText( 'Distributed editing status inspector mount' )
		).toBeVisible();
	} );
} );
