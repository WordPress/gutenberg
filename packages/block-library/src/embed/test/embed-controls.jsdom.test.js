import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createElement, useState } from '@wordpress/element';
import EmbedControls from '../embed-controls';

// The panel's dropdown menu reads the viewport.
globalThis.wpVitest.mockMatchMedia();

vi.mock( '@wordpress/block-editor', async () => {
	const { createElement: mockCreateElement } =
		await import( '@wordpress/element' );

	return {
		store: {},
		BlockControls: ( { children } ) =>
			mockCreateElement( 'div', null, children ),
		// The real component is a slot fill, so it renders nothing without a
		// block editor around it. Render the fill in place and record which
		// inspector group it was filled into.
		InspectorControls: ( { group, children } ) =>
			mockCreateElement(
				'div',
				{ 'data-testid': `inspector-controls-${ group ?? 'default' }` },
				children
			),
	};
} );

const EMBEDDED_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
const VIMEO_URL = 'https://vimeo.com/668136661';
const PEERTUBE_URL = 'https://tube.example/w/abc123';

const controlsProps = ( fallbacks, setFallbacks ) => ( {
	showEditButton: false,
	themeSupportsResponsive: false,
	blockSupportsResponsive: false,
	allowResponsive: true,
	toggleResponsive: () => {},
	switchBackToURLInput: () => {},
	url: EMBEDDED_URL,
	fallbacks,
	setFallbacks,
} );

/**
 * Renders the controls the way the block does: the list is owned by the block
 * attributes, so every edit round-trips through `setFallbacks`.
 *
 * @param {Object}   props
 * @param {string[]} [props.initialFallbacks] Source URLs the block starts with.
 * @param {Function} [props.onChange]         Called with each stored list.
 */
function ControlledEmbedControls( { initialFallbacks = [], onChange } ) {
	const [ fallbacks, setFallbacks ] = useState( initialFallbacks );

	return createElement(
		EmbedControls,
		controlsProps( fallbacks, ( value ) => {
			onChange?.( value );
			setFallbacks( value );
		} )
	);
}

const renderControls = ( props ) =>
	render( createElement( ControlledEmbedControls, props ) );

const getList = () => screen.getByRole( 'list', { name: 'Alternate sources' } );

const getRows = () => within( getList() ).getAllByRole( 'listitem' );

const getAddField = () =>
	screen.getByRole( 'textbox', { name: 'Add a source' } );

const getSourceField = () =>
	screen.getByRole( 'textbox', { name: 'Source URL' } );

const getButton = ( name ) => screen.getByRole( 'button', { name } );

/**
 * Opens the panel, which starts closed when the block has no source yet.
 *
 * @param {Object} user Testing library user event instance.
 */
const openPanel = async ( user ) => {
	const toggle = getButton( 'Alternate sources' );

	if ( toggle.getAttribute( 'aria-expanded' ) === 'false' ) {
		await user.click( toggle );
	}
};

/**
 * Types a URL into the add field and submits it.
 *
 * @param {Object} user Testing library user event instance.
 * @param {string} url  URL to add.
 */
const addSource = async ( user, url ) => {
	await user.type( getAddField(), url );
	await user.click( getButton( 'Add' ) );
};

describe( 'core/embed alternate sources', () => {
	it( 'has a panel of its own in the block settings', () => {
		renderControls();

		expect(
			within(
				screen.getByTestId( 'inspector-controls-default' )
			).getByRole( 'button', { name: 'Alternate sources' } )
		).toBeVisible();
	} );

	it( 'opens the panel on a block that already has sources', () => {
		renderControls( { initialFallbacks: [ VIMEO_URL ] } );

		expect( getButton( 'Alternate sources' ) ).toHaveAttribute(
			'aria-expanded',
			'true'
		);
	} );

	it( 'lists every stored source as a row of its own', () => {
		renderControls( { initialFallbacks: [ VIMEO_URL, PEERTUBE_URL ] } );

		expect( getRows() ).toHaveLength( 2 );
		expect( getRows()[ 0 ] ).toHaveTextContent( VIMEO_URL );
		expect( getRows()[ 1 ] ).toHaveTextContent( PEERTUBE_URL );
	} );

	it( 'shows no list until a source is added', async () => {
		const user = userEvent.setup();
		renderControls();
		await openPanel( user );

		expect(
			screen.queryByRole( 'list', { name: 'Alternate sources' } )
		).not.toBeInTheDocument();
		expect( getAddField() ).toBeVisible();
	} );

	it( 'stores a URL once it is submitted, not as it is typed', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderControls( { onChange } );
		await openPanel( user );

		await user.type( getAddField(), VIMEO_URL );

		expect( onChange ).not.toHaveBeenCalled();

		await user.click( getButton( 'Add' ) );

		expect( onChange ).toHaveBeenLastCalledWith( [ VIMEO_URL ] );
		expect( getRows()[ 0 ] ).toHaveTextContent( VIMEO_URL );
	} );

	it( 'adds a URL submitted with Enter, and empties the field for the next one', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderControls( { onChange } );
		await openPanel( user );

		await user.type( getAddField(), `${ VIMEO_URL }{Enter}` );

		expect( onChange ).toHaveBeenLastCalledWith( [ VIMEO_URL ] );
		expect( getAddField() ).toHaveValue( '' );
	} );

	it( 'refuses a URL the browser does not recognise as one', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderControls( { onChange } );
		await openPanel( user );

		await addSource( user, 'vimeo.com/668136661' );

		expect( onChange ).not.toHaveBeenCalled();
		expect(
			screen.queryByRole( 'list', { name: 'Alternate sources' } )
		).not.toBeInTheDocument();
	} );

	it( 'refuses a URL that is already listed, and says so', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderControls( { initialFallbacks: [ VIMEO_URL ], onChange } );

		await addSource( user, VIMEO_URL );

		expect( onChange ).not.toHaveBeenCalled();
		expect(
			screen.getByText( 'This source is already in the list.' )
		).toBeVisible();
	} );

	it( 'refuses the URL the block already embeds, and says so', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderControls( { onChange } );
		await openPanel( user );

		await addSource( user, EMBEDDED_URL );

		expect( onChange ).not.toHaveBeenCalled();
		expect(
			screen.getByText( 'This is the URL the block already embeds.' )
		).toBeVisible();
	} );

	it( 'edits a listed URL from the flyout its row opens', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderControls( {
			initialFallbacks: [ VIMEO_URL, PEERTUBE_URL ],
			onChange,
		} );

		await user.click( getButton( PEERTUBE_URL ) );
		await user.clear( getSourceField() );
		await user.type( getSourceField(), 'https://tube.example/w/xyz789' );

		// The row still reads as it is stored until the edit is saved.
		expect( onChange ).not.toHaveBeenCalled();
		expect( getRows()[ 1 ] ).toHaveTextContent( PEERTUBE_URL );

		await user.click( getButton( 'Save' ) );

		expect( onChange ).toHaveBeenLastCalledWith( [
			VIMEO_URL,
			'https://tube.example/w/xyz789',
		] );
		expect( getRows()[ 1 ] ).toHaveTextContent(
			'https://tube.example/w/xyz789'
		);
	} );

	it( 'closes the flyout once an edit is saved', async () => {
		const user = userEvent.setup();
		renderControls( { initialFallbacks: [ VIMEO_URL ] } );

		await user.click( getButton( VIMEO_URL ) );
		await user.clear( getSourceField() );
		await user.type( getSourceField(), PEERTUBE_URL );
		await user.click( getButton( 'Save' ) );

		expect(
			screen.queryByRole( 'textbox', { name: 'Source URL' } )
		).not.toBeInTheDocument();
	} );

	it( 'cannot save an edit that changes nothing', async () => {
		const user = userEvent.setup();
		renderControls( { initialFallbacks: [ VIMEO_URL ] } );

		await user.click( getButton( VIMEO_URL ) );

		expect( getButton( 'Save' ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'refuses an edit onto a URL another row already holds', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderControls( {
			initialFallbacks: [ VIMEO_URL, PEERTUBE_URL ],
			onChange,
		} );

		await user.click( getButton( PEERTUBE_URL ) );
		await user.clear( getSourceField() );
		await user.type( getSourceField(), VIMEO_URL );
		await user.click( getButton( 'Save' ) );

		expect( onChange ).not.toHaveBeenCalled();
		expect(
			screen.getByText( 'This source is already in the list.' )
		).toBeVisible();
	} );

	it( 'moves a source later in the list from its own flyout', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderControls( {
			initialFallbacks: [ VIMEO_URL, PEERTUBE_URL ],
			onChange,
		} );

		await user.click( getButton( VIMEO_URL ) );
		await user.click( getButton( 'Move down' ) );

		expect( onChange ).toHaveBeenLastCalledWith( [
			PEERTUBE_URL,
			VIMEO_URL,
		] );
		expect( getRows()[ 0 ] ).toHaveTextContent( PEERTUBE_URL );
	} );

	it( 'moves a source earlier in the list from its own flyout', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderControls( {
			initialFallbacks: [ VIMEO_URL, PEERTUBE_URL ],
			onChange,
		} );

		await user.click( getButton( PEERTUBE_URL ) );
		await user.click( getButton( 'Move up' ) );

		expect( onChange ).toHaveBeenLastCalledWith( [
			PEERTUBE_URL,
			VIMEO_URL,
		] );
	} );

	it( 'keeps the flyout on the source that was moved', async () => {
		const user = userEvent.setup();
		renderControls( { initialFallbacks: [ VIMEO_URL, PEERTUBE_URL ] } );

		await user.click( getButton( VIMEO_URL ) );
		await user.click( getButton( 'Move down' ) );

		// Still the flyout of the source that moved, so it can be moved again
		// without hunting for its row.
		expect( getSourceField() ).toHaveValue( VIMEO_URL );
		expect( getButton( 'Move down' ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'cannot move the first source up or the last source down', async () => {
		const user = userEvent.setup();
		renderControls( { initialFallbacks: [ VIMEO_URL, PEERTUBE_URL ] } );

		await user.click( getButton( VIMEO_URL ) );

		expect( getButton( 'Move up' ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		expect( getButton( 'Move down' ) ).not.toHaveAttribute(
			'aria-disabled'
		);
	} );

	it( 'removes a source from its own flyout', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderControls( {
			initialFallbacks: [ VIMEO_URL, PEERTUBE_URL ],
			onChange,
		} );

		await user.click( getButton( VIMEO_URL ) );
		await user.click( getButton( 'Remove source' ) );

		expect( onChange ).toHaveBeenLastCalledWith( [ PEERTUBE_URL ] );
		expect(
			screen.queryByRole( 'button', { name: VIMEO_URL } )
		).not.toBeInTheDocument();
	} );

	it( 'moves focus to the add field when a source is removed', async () => {
		const user = userEvent.setup();
		renderControls( { initialFallbacks: [ VIMEO_URL ] } );

		await user.click( getButton( VIMEO_URL ) );
		await user.click( getButton( 'Remove source' ) );

		// The button that removed the row went away with it, so focus has to
		// land somewhere the list can be worked on again.
		expect( getAddField() ).toHaveFocus();
	} );

	it( 'closes the flyout when the row that opened it is clicked again', async () => {
		const user = userEvent.setup();
		renderControls( { initialFallbacks: [ VIMEO_URL ] } );

		await user.click( getButton( VIMEO_URL ) );
		await user.click( getButton( VIMEO_URL ) );

		expect(
			screen.queryByRole( 'textbox', { name: 'Source URL' } )
		).not.toBeInTheDocument();
	} );

	it( 'closes the flyout on Escape, back on the row it belongs to', async () => {
		const user = userEvent.setup();
		renderControls( { initialFallbacks: [ VIMEO_URL ] } );

		await user.click( getButton( VIMEO_URL ) );
		// The flyout focuses its field on its own, which needs a layout this
		// environment has none of.
		await user.click( getSourceField() );
		await user.keyboard( '{Escape}' );

		expect(
			screen.queryByRole( 'textbox', { name: 'Source URL' } )
		).not.toBeInTheDocument();
		expect( getButton( VIMEO_URL ) ).toHaveFocus();
	} );

	it( 'drops an unsaved edit when the flyout is reopened', async () => {
		const user = userEvent.setup();
		renderControls( { initialFallbacks: [ VIMEO_URL ] } );

		await user.click( getButton( VIMEO_URL ) );
		await user.clear( getSourceField() );
		await user.type( getSourceField(), PEERTUBE_URL );
		await user.click( getButton( VIMEO_URL ) );
		await user.click( getButton( VIMEO_URL ) );

		expect( getSourceField() ).toHaveValue( VIMEO_URL );
	} );

	it( 'removes every source at once, and only when there is more than one', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderControls( {
			initialFallbacks: [ VIMEO_URL, PEERTUBE_URL ],
			onChange,
		} );

		await user.click( getButton( 'Remove all' ) );

		expect( onChange ).toHaveBeenLastCalledWith( [] );
		expect(
			screen.queryByRole( 'list', { name: 'Alternate sources' } )
		).not.toBeInTheDocument();
		// A single source is removed from its own row, so the list needs no
		// second way to empty it.
		expect(
			screen.queryByRole( 'button', { name: 'Remove all' } )
		).not.toBeInTheDocument();
	} );

	it( 'stays open once the last source is removed', async () => {
		const user = userEvent.setup();
		renderControls( { initialFallbacks: [ VIMEO_URL ] } );

		await user.click( getButton( VIMEO_URL ) );
		await user.click( getButton( 'Remove source' ) );

		// The panel opened because the block had a source. Closing itself the
		// moment the last one goes would take the add field with it.
		expect( getButton( 'Alternate sources' ) ).toHaveAttribute(
			'aria-expanded',
			'true'
		);
		expect( getAddField() ).toBeVisible();
	} );

	it( 'reads a list the block has no business holding as no source at all', () => {
		// A post can be edited by hand, so the attribute is not guaranteed to
		// hold what the block defines.
		render(
			createElement(
				EmbedControls,
				controlsProps( VIMEO_URL, () => {} )
			)
		);

		expect(
			screen.queryByRole( 'list', { name: 'Alternate sources' } )
		).not.toBeInTheDocument();
	} );

	it( 'shows a URL stored twice as the single row it will be saved as', () => {
		render(
			createElement(
				EmbedControls,
				controlsProps( [ VIMEO_URL, ' ', VIMEO_URL ], () => {} )
			)
		);

		expect( getRows() ).toHaveLength( 1 );
		expect( getRows()[ 0 ] ).toHaveTextContent( VIMEO_URL );
	} );
} );
