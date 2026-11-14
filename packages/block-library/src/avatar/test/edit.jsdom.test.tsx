import { beforeEach, describe, expect, test } from 'vitest';
import { screen } from '@testing-library/react';
import { createBlock, registerBlockType } from '@wordpress/blocks';
import {
	store as blockEditorStore,
	useBlockProps,
} from '@wordpress/block-editor';
import { useDispatch } from '@wordpress/data';
import { createElement, useEffect } from '@wordpress/element';
import {
	initializeEditor,
	selectBlock,
} from '@wordpress/integration-tests/helpers/integration-test-editor';
// @ts-expect-error Untyped package in this workspace
import { registerCoreBlocks } from '@wordpress/block-library';
import { unlock } from '../../lock-unlock';

globalThis.wpVitest.mockMatchMedia();
globalThis.wpVitest.mockResizeObserver();

const VIEWPORT_STATE_INITIALIZER = 'test/viewport-state-initializer';

function ViewportStateInitializer() {
	const { setResponsiveEditing, setStyleStateViewport } = unlock(
		useDispatch( blockEditorStore )
	);

	useEffect( () => {
		setResponsiveEditing( true );
		setStyleStateViewport( '@mobile' );
	}, [ setResponsiveEditing, setStyleStateViewport ] );

	const blockProps = useBlockProps();
	return createElement( 'div', blockProps );
}

async function setup( block: Parameters< typeof initializeEditor >[ 0 ] ) {
	return initializeEditor( block, false, {} );
}

describe( 'Avatar block', () => {
	beforeEach( () => {
		registerCoreBlocks();
		registerBlockType( VIEWPORT_STATE_INITIALIZER, {
			apiVersion: 3,
			title: 'Viewport state initializer',
			category: 'text',
			attributes: {},
			supports: {
				html: false,
				inserter: false,
			},
			edit: ViewportStateInitializer,
			save: () => null,
		} );
	} );

	test( 'shows all settings in default state', async () => {
		await setup( createBlock( 'core/avatar', { size: 96 } ) );
		await selectBlock( 'Block: Avatar' );

		expect(
			await screen.findByRole( 'slider', { name: 'Image size' } )
		).toBeInTheDocument();
		expect(
			screen.getByLabelText( 'Link to user profile' )
		).toBeInTheDocument();
	} );

	test( 'shows only image size in viewport state and hides profile link toggles', async () => {
		await setup( [
			createBlock( 'core/avatar', { size: 96 } ),
			createBlock( VIEWPORT_STATE_INITIALIZER ),
		] );
		await selectBlock( 'Block: Avatar' );

		expect(
			await screen.findByRole( 'slider', { name: 'Image size' } )
		).toBeInTheDocument();
		expect(
			screen.queryByLabelText( 'Link to user profile' )
		).not.toBeInTheDocument();
		expect(
			screen.queryByLabelText( 'Open in new tab' )
		).not.toBeInTheDocument();
	} );

	test( 'generates scoped responsive stylesheet in viewport state', async () => {
		await setup( [
			createBlock( 'core/avatar', {
				size: 96,
				style: {
					'@mobile': {
						dimensions: {
							width: '48px',
							height: '48px',
						},
					},
				},
			} ),
			createBlock( VIEWPORT_STATE_INITIALIZER ),
		] );
		await selectBlock( 'Block: Avatar' );

		// eslint-disable-next-line testing-library/no-node-access
		const styleElements = document.querySelectorAll( 'style' );
		expect(
			Array.from( styleElements ).some( ( element ) =>
				element.textContent?.includes( 'width: 48px !important' )
			)
		).toBe( true );
	} );
} );
