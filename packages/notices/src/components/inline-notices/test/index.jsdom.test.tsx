import { describe, expect, it } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import InlineNotices from '../index';
import { store as noticesStore } from '../../../store';

function getInlineNoticesWrapper( container: HTMLElement ) {
	return container.querySelector< HTMLElement >(
		'.notices-inline-notices-wrapper'
	)!;
}

function renderInlineNotices( props = {} ) {
	const registry = createRegistry();
	registry.register( noticesStore );

	const view = render(
		<RegistryProvider value={ registry }>
			<InlineNotices { ...props } />
		</RegistryProvider>
	);

	return { registry, ...view };
}

describe( 'InlineNotices', () => {
	it( 'keeps empty announcement regions without a visible wrapper when there are no notices', () => {
		const { container } = renderInlineNotices();

		expect( getInlineNoticesWrapper( container ) ).toBeNull();
		expect( screen.getByRole( 'status' ) ).toBeEmptyDOMElement();
		expect( screen.getByRole( 'alert' ) ).toBeEmptyDOMElement();
	} );

	it( 'omits the visible wrapper when children is false and there are no notices', () => {
		const { container } = renderInlineNotices( {
			children: false,
		} );

		expect( getInlineNoticesWrapper( container ) ).toBeNull();
	} );

	it( 'omits the visible wrapper when every child renders nothing', () => {
		// More than one child arrives as an array, which is itself neither
		// `false` nor empty, so the array is what has to be looked through.
		const { container } = renderInlineNotices( {
			children: [ false, null, undefined, '' ],
		} );

		expect( getInlineNoticesWrapper( container ) ).toBeNull();
	} );

	it( 'should render when one of several children renders something', () => {
		const { container } = renderInlineNotices( {
			children: [ false, <div key="notice">Extra notice</div> ],
		} );

		expect(
			within( getInlineNoticesWrapper( container ) ).getByText(
				'Extra notice'
			)
		).toBeInTheDocument();
	} );

	it( 'should render the inline notices wrapper with a custom class name', () => {
		const { container } = renderInlineNotices( {
			className: 'my-inline-notices',
			children: <div>Extra notice</div>,
		} );

		expect( getInlineNoticesWrapper( container ) ).toHaveClass(
			'notices-inline-notices-wrapper',
			'my-inline-notices'
		);
	} );

	it( 'renders pinned notices without a close button', () => {
		const registry = createRegistry();
		registry.register( noticesStore );
		registry
			.dispatch( noticesStore )
			.createNotice( 'warning', 'Pinned notice', {
				isDismissible: false,
			} );

		const { container } = render(
			<RegistryProvider value={ registry }>
				<InlineNotices />
			</RegistryProvider>
		);

		expect(
			within( getInlineNoticesWrapper( container ) ).getByText(
				'Pinned notice'
			)
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: 'Close' } )
		).not.toBeInTheDocument();
	} );

	it( 'renders dismissible notices with a close button', () => {
		const registry = createRegistry();
		registry.register( noticesStore );
		registry
			.dispatch( noticesStore )
			.createNotice( 'warning', 'Dismissible notice' );

		render(
			<RegistryProvider value={ registry }>
				<InlineNotices />
			</RegistryProvider>
		);

		expect(
			screen.getByRole( 'button', { name: 'Close' } )
		).toBeInTheDocument();
	} );

	it( 'partitions pinned and dismissible notices into separate lists', () => {
		const registry = createRegistry();
		registry.register( noticesStore );
		registry
			.dispatch( noticesStore )
			.createNotice( 'warning', 'Pinned notice', {
				isDismissible: false,
			} );
		registry
			.dispatch( noticesStore )
			.createNotice( 'success', 'Dismissible notice' );

		const { container } = render(
			<RegistryProvider value={ registry }>
				<InlineNotices
					pinnedNoticesClassName="test-pinned"
					dismissibleNoticesClassName="test-dismissible"
				/>
			</RegistryProvider>
		);

		const pinned =
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- partition via public className props.
			container.querySelector< HTMLElement >( '.test-pinned' )!;
		const dismissible =
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- partition via public className props.
			container.querySelector< HTMLElement >( '.test-dismissible' )!;

		expect(
			within( pinned ).getByText( 'Pinned notice' )
		).toBeInTheDocument();
		expect(
			within( pinned ).queryByText( 'Dismissible notice' )
		).not.toBeInTheDocument();
		expect(
			within( dismissible ).getByText( 'Dismissible notice' )
		).toBeInTheDocument();
		expect(
			within( dismissible ).queryByText( 'Pinned notice' )
		).not.toBeInTheDocument();
	} );

	it( 'renders children in the dismissible list', () => {
		const { container } = renderInlineNotices( {
			children: <div>Extra notice</div>,
			dismissibleNoticesClassName: 'test-dismissible',
		} );

		const dismissible =
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- partition via public className props.
			container.querySelector< HTMLElement >( '.test-dismissible' )!;

		expect(
			within( dismissible ).getByText( 'Extra notice' )
		).toBeInTheDocument();
	} );

	describe( 'announcements', () => {
		it( 'announces new notices without details or action labels', async () => {
			const { registry } = renderInlineNotices();

			await act( async () => {
				registry
					.dispatch( noticesStore )
					.createNotice( 'error', 'Updating failed.', {
						details: 'Technical details.',
						actions: [ { label: 'Try again', onClick() {} } ],
					} );
			} );

			expect( screen.getByRole( 'alert' ) ).toHaveTextContent(
				/^Updating failed\.$/
			);
			for ( const status of screen.getAllByRole( 'status' ) ) {
				expect( status ).toBeEmptyDOMElement();
			}
		} );

		it( 'announces non-error notices politely', async () => {
			const { registry } = renderInlineNotices();

			await act( async () => {
				registry
					.dispatch( noticesStore )
					.createNotice( 'success', 'Draft saved.' );
			} );

			expect( screen.getByRole( 'status' ) ).toHaveTextContent(
				'Draft saved.'
			);
			expect( screen.getByRole( 'alert' ) ).toBeEmptyDOMElement();
		} );

		it( 'keeps speak:false notices silent', async () => {
			const { registry } = renderInlineNotices();

			await act( async () => {
				registry
					.dispatch( noticesStore )
					.createNotice( 'error', 'Updating failed.', {
						speak: false,
					} );
			} );

			expect(
				screen.getByText( 'Updating failed.' )
			).toBeInTheDocument();
			expect( screen.getByRole( 'status' ) ).toBeEmptyDOMElement();
			expect( screen.getByRole( 'alert' ) ).toBeEmptyDOMElement();
		} );
	} );
} );
