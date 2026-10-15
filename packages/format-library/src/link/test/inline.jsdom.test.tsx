import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { createElement } from '@wordpress/element';
import { createRegistry, RegistryProvider, select } from '@wordpress/data';
// @ts-expect-error The block-editor package does not expose TypeScript declarations.
import { store as blockEditorStore } from '@wordpress/block-editor';
import {
	create,
	registerFormatType,
	store as richTextStore,
	toHTMLString,
	unregisterFormatType,
} from '@wordpress/rich-text';
import type { RichTextValue } from '@wordpress/rich-text';
import InlineLinkUI from '../inline';
import { link } from '../index';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

type LinkChanges = Record< string, string | boolean >;
const controls = vi.hoisted( () => ( { nextValue: {} as LinkChanges } ) );

// @ts-expect-error The block-editor package does not expose TypeScript declarations.
vi.mock( import( '@wordpress/block-editor' ), async ( importOriginal ) => {
	const actual = await importOriginal();
	return {
		...actual,
		LinkControl: Object.assign(
			function LinkControl( {
				onChange,
				onRemove,
			}: {
				onChange: ( nextValue: LinkChanges ) => void;
				onRemove: () => void;
			} ) {
				return createElement(
					'div',
					null,
					createElement(
						'button',
						{ onClick: () => onChange( controls.nextValue ) },
						'Apply link'
					),
					createElement(
						'button',
						{ onClick: onRemove },
						'Remove link'
					)
				);
			},
			{ DEFAULT_LINK_SETTINGS: actual.LinkControl.DEFAULT_LINK_SETTINGS }
		),
	};
} );

const HTML =
	'<a href="https://old.example" id="manual-id" class="button" data-pizza="Pepperoni" aria-label="Accessible label" title="Tooltip" data-plugin="Plugin metadata">Link</a>';

let editable: HTMLDivElement | undefined;
let originalFormat: Parameters< typeof registerFormatType >[ 1 ] | undefined;

beforeEach( () => {
	originalFormat = select( richTextStore ).getFormatType( 'core/link' );
	if ( originalFormat ) {
		unregisterFormatType( 'core/link' );
	}
	registerFormatType( 'core/link', {
		...link,
		attributes: { ...link.attributes, pluginValue: 'data-plugin' },
	} );
	controls.nextValue = {};
} );

afterEach( () => {
	editable?.remove();
	unregisterFormatType( 'core/link' );
	if ( originalFormat ) {
		registerFormatType( 'core/link', originalFormat );
	}
} );

function setupInlineLink( {
	html = HTML,
	start = 1,
	end = start,
	isActive = true,
}: {
	html?: string;
	start?: number;
	end?: number;
	isActive?: boolean;
} = {} ) {
	const registry = createRegistry();
	registry.register( blockEditorStore );
	const value = { ...create( { html } ), start, end };
	const activeFormat =
		value.formats[ start ]?.find(
			( format ) => format.type === 'core/link'
		) ||
		value.formats[ start - 1 ]?.find(
			( format ) => format.type === 'core/link'
		);
	const onChange = vi.fn< ( value: RichTextValue ) => void >();
	editable = document.createElement( 'div' );
	editable.ownerDocument.defaultView?.getSelection()?.removeAllRanges();
	editable.innerHTML = html;
	document.body.append( editable );
	render(
		createElement(
			RegistryProvider,
			{ value: registry },
			createElement( InlineLinkUI, {
				isActive,
				activeAttributes: {
					url: '',
					...( isActive ? activeFormat?.attributes : {} ),
				},
				value,
				onChange,
				onFocusOutside: vi.fn(),
				stopAddingLink: vi.fn(),
				contentRef: { current: editable },
				focusOnMount: false,
			} )
		)
	);
	return onChange;
}

function submitLink(
	onChange: ReturnType< typeof setupInlineLink >,
	nextValue: LinkChanges
) {
	controls.nextValue = nextValue;
	fireEvent.click( screen.getByRole( 'button', { name: 'Apply link' } ) );
	expect( onChange ).toHaveBeenCalledOnce();
	const output = document.createElement( 'div' );
	output.innerHTML = toHTMLString( { value: onChange.mock.calls[ 0 ][ 0 ] } );
	return output;
}

function expectCustomAttributes( anchor: HTMLElement ) {
	expect( anchor ).toHaveAttribute( 'id', 'manual-id' );
	expect( anchor ).toHaveAttribute( 'data-pizza', 'Pepperoni' );
	expect( anchor ).toHaveAttribute( 'aria-label', 'Accessible label' );
	expect( anchor ).toHaveAttribute( 'title', 'Tooltip' );
	expect( anchor ).toHaveAttribute( 'data-plugin', 'Plugin metadata' );
}

describe( 'InlineLinkUI custom attributes', () => {
	it.each< {
		label: string;
		nextValue: LinkChanges;
		text: string;
		href: string;
	} >( [
		{
			label: 'URL',
			nextValue: { url: 'https://new.example' },
			text: 'Link',
			href: 'https://new.example',
		},
		{
			label: 'link text',
			nextValue: { title: 'Renamed' },
			text: 'Renamed',
			href: 'https://old.example',
		},
	] )(
		'preserves metadata when editing the $label',
		( { nextValue, text, href } ) => {
			const output = submitLink( setupInlineLink(), nextValue );
			const anchor = within( output ).getByRole( 'link' );
			expectCustomAttributes( anchor );
			expect( anchor ).toHaveTextContent( text );
			expect( anchor ).toHaveAttribute( 'href', href );
		}
	);

	it( 'preserves metadata when opening the link in a new tab', () => {
		const output = submitLink( setupInlineLink(), { opensInNewTab: true } );
		const anchor = within( output ).getByRole( 'link' );
		expectCustomAttributes( anchor );
		expect( anchor ).toHaveAttribute( 'target', '_blank' );
	} );

	it.each( [ 0, 4 ] )(
		'preserves metadata with the caret at boundary %s',
		( start ) => {
			const output = submitLink( setupInlineLink( { start } ), {
				url: 'https://new.example',
			} );
			const anchor = within( output ).getByRole( 'link' );
			expectCustomAttributes( anchor );
			expect( anchor ).toHaveAttribute( 'href', 'https://new.example' );
		}
	);

	it( 'preserves only the selected link metadata when identical text occurs twice', () => {
		const html =
			'<a href="https://first.example" data-first="first">Link</a> ' +
			HTML;
		const output = submitLink( setupInlineLink( { html, start: 6 } ), {
			title: 'Renamed',
		} );
		const [ first, second ] = within( output ).getAllByRole( 'link' );
		expect( first ).toHaveAttribute( 'href', 'https://first.example' );
		expect( first ).toHaveAttribute( 'data-first', 'first' );
		expect( first ).toHaveTextContent( 'Link' );
		expectCustomAttributes( second );
		expect( second ).not.toHaveAttribute( 'data-first' );
		expect( second ).toHaveTextContent( 'Renamed' );
	} );

	it( 'clears managed settings while retaining independent metadata', () => {
		const html = HTML.replace(
			'<a ',
			'<a target="_blank" rel="noopener nofollow" '
		);
		const output = submitLink( setupInlineLink( { html } ), {
			opensInNewTab: false,
			nofollow: false,
			cssClasses: '',
		} );
		const anchor = within( output ).getByRole( 'link' );
		expectCustomAttributes( anchor );
		expect( anchor ).not.toHaveAttribute( 'target' );
		expect( anchor ).not.toHaveAttribute( 'rel' );
		expect( anchor ).not.toHaveAttribute( 'class' );
	} );

	it( 'does not copy neighboring link metadata onto a new link', () => {
		const output = submitLink(
			setupInlineLink( {
				html: HTML + ' Plain',
				start: 5,
				end: 10,
				isActive: false,
			} ),
			{ url: 'https://new.example' }
		);
		const [ original, added ] = within( output ).getAllByRole( 'link' );
		expectCustomAttributes( original );
		expect( added ).toHaveAttribute( 'href', 'https://new.example' );
		expect( added?.getAttributeNames() ).toEqual( [ 'href' ] );
	} );

	it( 'removes the entire link and all its metadata when unlinked', () => {
		const onChange = setupInlineLink( { start: 0, end: 4 } );
		fireEvent.click(
			screen.getByRole( 'button', { name: 'Remove link' } )
		);
		expect( toHTMLString( { value: onChange.mock.calls[ 0 ][ 0 ] } ) ).toBe(
			'Link'
		);
	} );
} );
