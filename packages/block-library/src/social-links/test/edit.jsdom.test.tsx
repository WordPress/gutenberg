import { beforeEach, describe, expect, test } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

describe( 'Social Links block', () => {
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
		await setup(
			createBlock( 'core/social-links', {}, [
				createBlock( 'core/social-link', {
					url: 'https://wordpress.org',
					service: 'wordpress',
				} ),
			] )
		);
		await selectBlock( 'Block: Social Icons' );

		expect(
			await screen.findByRole( 'combobox', { name: 'Icon size' } )
		).toBeInTheDocument();
		expect( screen.getByLabelText( 'Show text' ) ).toBeInTheDocument();
		expect(
			screen.getByLabelText( 'Open links in new tab' )
		).toBeInTheDocument();
	} );

	test( 'shows only icon size in viewport state and hides text and tab toggles', async () => {
		await setup( [
			createBlock( 'core/social-links', {}, [
				createBlock( 'core/social-link', {
					url: 'https://wordpress.org',
					service: 'wordpress',
				} ),
			] ),
			createBlock( VIEWPORT_STATE_INITIALIZER ),
		] );
		await selectBlock( 'Block: Social Icons' );

		expect(
			await screen.findByRole( 'combobox', { name: 'Icon size' } )
		).toBeInTheDocument();
		expect(
			screen.queryByLabelText( 'Show text' )
		).not.toBeInTheDocument();
		expect(
			screen.queryByLabelText( 'Open links in new tab' )
		).not.toBeInTheDocument();
	} );

	test( 'updates the size class name in default state', async () => {
		const user = userEvent.setup();
		await setup(
			createBlock( 'core/social-links', {}, [
				createBlock( 'core/social-link', {
					url: 'https://wordpress.org',
					service: 'wordpress',
				} ),
			] )
		);
		await selectBlock( 'Block: Social Icons' );

		const combobox = await screen.findByRole( 'combobox', {
			name: 'Icon size',
		} );
		await user.click( combobox );

		const smallOption = await screen.findByRole( 'option', {
			name: 'Small',
		} );
		await user.click( smallOption );

		// eslint-disable-next-line testing-library/no-node-access
		const socialLinksElement = document.querySelector(
			'.wp-block-social-links'
		);
		expect( socialLinksElement ).toHaveClass( 'has-small-icon-size' );
	} );

	test( 'generates scoped responsive stylesheet in viewport state', async () => {
		const user = userEvent.setup();
		await setup( [
			createBlock( 'core/social-links', { size: 'has-large-icon-size' }, [
				createBlock( 'core/social-link', {
					url: 'https://wordpress.org',
					service: 'wordpress',
				} ),
			] ),
			createBlock( VIEWPORT_STATE_INITIALIZER ),
		] );
		await selectBlock( 'Block: Social Icons' );

		const combobox = await screen.findByRole( 'combobox', {
			name: 'Icon size',
		} );
		await user.click( combobox );

		const smallOption = await screen.findByRole( 'option', {
			name: 'Small',
		} );
		await user.click( smallOption );

		// eslint-disable-next-line testing-library/no-node-access
		const styleElements = document.querySelectorAll( 'style' );
		expect(
			Array.from( styleElements ).some( ( element ) =>
				element.textContent?.includes( 'font-size: 16px !important' )
			)
		).toBe( true );
	} );
} );
