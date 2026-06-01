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

	function MockDistributedEditingStatusChrome() {
		return createElement(
			'div',
			null,
			'Distributed editing status chrome mount'
		);
	}

	function MockDistributedEditingStatusInspector() {
		return createElement(
			'div',
			null,
			'Distributed editing status inspector mount'
		);
	}

	function MockDistributedEditingFreshReviewPrePublishPanel() {
		return createElement(
			'div',
			null,
			'Distributed editing fresh review pre-publish mount'
		);
	}

	return {
		__esModule: true,
		DistributedEditingFreshReviewPrePublishPanel:
			MockDistributedEditingFreshReviewPrePublishPanel,
		DistributedEditingStatusChrome: MockDistributedEditingStatusChrome,
		DistributedEditingStatusInspector:
			MockDistributedEditingStatusInspector,
	};
} );

jest.mock( '../../distributed-editing-risky-block-review', () => {
	const { createElement } = require( '@wordpress/element' );

	function MockDistributedEditingRiskyBlockReviewPrePublishPanel() {
		return createElement(
			'div',
			null,
			'Distributed editing risky block review pre-publish mount'
		);
	}

	function MockDistributedEditingRiskyBlockReviewStatusChrome() {
		return createElement(
			'div',
			null,
			'Distributed editing risky block review chrome mount'
		);
	}

	return {
		__esModule: true,
		default: MockDistributedEditingRiskyBlockReviewPrePublishPanel,
		DistributedEditingRiskyBlockReviewStatusChrome:
			MockDistributedEditingRiskyBlockReviewStatusChrome,
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
			screen.getByText(
				'Distributed editing risky block review chrome mount'
			)
		).toBeVisible();
		expect(
			screen.getByText(
				'Distributed editing risky block review pre-publish mount'
			)
		).toBeVisible();
		expect(
			screen.getByText(
				'Distributed editing fresh review pre-publish mount'
			)
		).toBeVisible();
		expect(
			screen.getByText( 'Distributed editing status chrome mount' )
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
