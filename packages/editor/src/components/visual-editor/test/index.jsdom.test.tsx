import { beforeAll, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { dispatch } from '@wordpress/data';
import { registerBlockType } from '@wordpress/blocks';
import { store as editorStore } from '../../../store';
import VisualEditorComponent from '../index';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );
globalThis.wpVitest.mockResizeObserver();

const VisualEditor = VisualEditorComponent as ComponentType;

vi.mock( '@wordpress/block-editor', async ( importOriginal ) => {
	const actual = await importOriginal< Record< string, unknown > >();
	const { lock, unlock } = await import( '../../../lock-unlock' );
	const privateApis = {};
	lock( privateApis, {
		...( unlock( actual.privateApis ) as Record< string, unknown > ),
		ExperimentalBlockCanvas: ( { children }: { children: ReactNode } ) => (
			<div>{ children }</div>
		),
	} );
	return {
		...actual,
		privateApis,
		BlockList: ( { className }: { className: string } ) => (
			<div data-testid="block-list" className={ className } />
		),
	};
} );

describe( 'VisualEditor', () => {
	beforeAll( () => {
		registerBlockType( 'core/post-content', {
			apiVersion: 3,
			title: 'Content',
			category: 'theme',
			attributes: {},
			styles: [ { name: 'red-headings', label: 'Red headings' } ],
			edit: () => null,
			save: () => null,
		} );
	} );

	it( 'applies the Post Content style variation when the template is hidden', () => {
		dispatch( editorStore ).updateEditorSettings( {
			postContentAttributes: { className: 'is-style-red-headings' },
		} );

		render( <VisualEditor /> );

		expect( screen.getByTestId( 'block-list' ) ).toHaveClass(
			'wp-block-post-content',
			'is-style-red-headings-post-content'
		);
	} );
} );
