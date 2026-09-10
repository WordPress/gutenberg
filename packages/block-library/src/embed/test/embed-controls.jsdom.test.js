import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createElement, useState } from '@wordpress/element';
import EmbedControls from '../embed-controls';

vi.mock( '@wordpress/block-editor', async () => {
	const { createElement: mockCreateElement } = await import(
		'@wordpress/element'
	);

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

const VIMEO_URL = 'https://vimeo.com/668136661';
const PEERTUBE_URL = 'https://tube.example/w/abc123';

const controlsProps = ( fallbacks, setFallbacks ) => ( {
	showEditButton: false,
	themeSupportsResponsive: false,
	blockSupportsResponsive: false,
	allowResponsive: true,
	toggleResponsive: () => {},
	switchBackToURLInput: () => {},
	fallbacks,
	setFallbacks,
} );

/**
 * Renders the controls the way the block does: the list is owned by the block
 * attributes, so every keystroke round-trips through `setFallbacks`.
 *
 * @param {Object}   props
 * @param {string[]} [props.initialFallbacks] Fallback URLs the block starts with.
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

const getFallbacksField = () =>
	screen.getByRole( 'textbox', { name: 'Fallback URLs' } );

describe( 'core/embed fallback URLs control', () => {
	it( 'lives in the Advanced panel', () => {
		renderControls();

		expect(
			within(
				screen.getByTestId( 'inspector-controls-advanced' )
			).getByRole( 'textbox', { name: 'Fallback URLs' } )
		).toBeVisible();
	} );

	it( 'shows the stored fallback URLs one per line', () => {
		renderControls( { initialFallbacks: [ VIMEO_URL, PEERTUBE_URL ] } );

		expect( getFallbacksField() ).toHaveValue(
			`${ VIMEO_URL }\n${ PEERTUBE_URL }`
		);
	} );

	it( 'is empty when the block has no fallback URL', () => {
		renderControls();

		expect( getFallbacksField() ).toHaveValue( '' );
	} );

	it( 'stores a single typed URL', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderControls( { onChange } );

		await user.type( getFallbacksField(), VIMEO_URL );

		expect( onChange ).toHaveBeenLastCalledWith( [ VIMEO_URL ] );
	} );

	it( 'stores a second URL typed on a new line', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderControls( {
			initialFallbacks: [ VIMEO_URL ],
			onChange,
		} );

		const field = getFallbacksField();
		await user.click( field );
		await user.keyboard( `{End}{Enter}${ PEERTUBE_URL }` );

		expect( field ).toHaveValue( `${ VIMEO_URL }\n${ PEERTUBE_URL }` );
		expect( onChange ).toHaveBeenLastCalledWith( [
			VIMEO_URL,
			PEERTUBE_URL,
		] );
	} );

	it( 'ignores blank lines and surrounding whitespace', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderControls( { onChange } );

		await user.click( getFallbacksField() );
		await user.keyboard(
			`  ${ VIMEO_URL }  {Enter}{Enter}\t${ PEERTUBE_URL }`
		);

		expect( onChange ).toHaveBeenLastCalledWith( [
			VIMEO_URL,
			PEERTUBE_URL,
		] );
	} );

	it( 'shows the stored list again when it changes elsewhere, such as on undo', () => {
		const { rerender } = render(
			createElement(
				EmbedControls,
				controlsProps( [ VIMEO_URL, PEERTUBE_URL ], () => {} )
			)
		);

		rerender(
			createElement(
				EmbedControls,
				controlsProps( [ VIMEO_URL ], () => {} )
			)
		);

		expect( getFallbacksField() ).toHaveValue( VIMEO_URL );
	} );

	it( 'stores an empty list when the field is cleared', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderControls( {
			initialFallbacks: [ VIMEO_URL ],
			onChange,
		} );

		await user.clear( getFallbacksField() );

		expect( onChange ).toHaveBeenLastCalledWith( [] );
		expect( getFallbacksField() ).toHaveValue( '' );
	} );
} );
