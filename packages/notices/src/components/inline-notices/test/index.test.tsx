/**
 * External dependencies
 */
import { render, screen, within } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { createRegistry, RegistryProvider } from '@wordpress/data';

/**
 * Internal dependencies
 */
import InlineNotices from '../index';
import { store as noticesStore } from '../../../store';

function getInlineNoticesWrapper( container: HTMLElement ) {
	return container.firstChild as HTMLElement;
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
	it( 'should return null when there are no notices and no children', () => {
		const { container } = renderInlineNotices();

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should return null when children is false and there are no notices', () => {
		const { container } = renderInlineNotices( {
			children: false,
		} );

		expect( container ).toBeEmptyDOMElement();
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

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- partition via public className props.
		const pinned = container.querySelector( '.test-pinned' )!;
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- partition via public className props.
		const dismissible = container.querySelector( '.test-dismissible' )!;

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

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- partition via public className props.
		const dismissible = container.querySelector( '.test-dismissible' )!;

		expect(
			within( dismissible ).getByText( 'Extra notice' )
		).toBeInTheDocument();
	} );
} );
