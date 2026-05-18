/**
 * External dependencies
 */
import { render, within } from '@testing-library/react';

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

	it( 'should render the inline notices wrapper with a custom class name', () => {
		const { container } = renderInlineNotices( {
			className: 'my-inline-notices',
			children: <div>Extra notice</div>,
		} );

		expect( getInlineNoticesWrapper( container ) ).toHaveClass(
			'components-inline-notices',
			'my-inline-notices'
		);
	} );

	it( 'should only render the pinned list when there are pinned notices', () => {
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

		const wrapper = getInlineNoticesWrapper( container );
		expect(
			within( wrapper ).getByText( 'Pinned notice', {
				selector: '.components-notice__content',
			} )
		).toBeInTheDocument();
		expect(
			within( wrapper ).queryByText( 'Pinned notice', {
				selector: '.components-notices__dismissible *',
			} )
		).not.toBeInTheDocument();
	} );

	it( 'should render the dismissible list when children are provided', () => {
		const { container } = renderInlineNotices( {
			children: <div>Extra notice</div>,
		} );

		const wrapper = getInlineNoticesWrapper( container );
		expect(
			within( wrapper ).getByText( 'Extra notice' )
		).toBeInTheDocument();
		expect(
			within( wrapper ).queryByText( 'Extra notice', {
				selector: '.components-notices__pinned *',
			} )
		).not.toBeInTheDocument();
	} );
} );
