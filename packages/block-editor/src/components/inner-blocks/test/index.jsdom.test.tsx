/* eslint-disable testing-library/render-result-naming-convention */

import type { ReactElement } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
	createBlock,
	getBlockTypes,
	getSaveElement,
	registerBlockType,
	serialize,
	unregisterBlockType,
} from '@wordpress/blocks';
import { renderToString } from '@wordpress/element';
import { useRegistry } from '@wordpress/data';
import type { DataRegistry } from '@wordpress/data';
import { render, waitFor } from '@testing-library/react';
import InnerBlocks, { useInnerBlocksProps } from '../';
import type { InnerBlocksOptions } from '../types';
import { BlockEditorProvider } from '../../provider';
import { BlockEditContextProvider } from '../../block-edit/context';
import { store as blockEditorStore } from '../../../store';
import {
	detachesOnEditKey,
	isMoveTransparentKey,
} from '../../../store/private-keys';

describe( 'InnerBlocks', () => {
	afterEach( () => {
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	it( 'should return element as string, with inner blocks', () => {
		registerBlockType( 'core/fruit', {
			apiVersion: 3,
			category: 'text',

			title: 'fruit',

			attributes: {
				fruit: {
					type: 'string',
				},
			},

			supports: {
				className: false,
			},

			save( { attributes } ) {
				return (
					<div>
						{
							// The attribute is a string.
							attributes.fruit as string
						}
						<InnerBlocks.Content />
					</div>
				);
			},
		} );

		const saved = renderToString(
			// The save function returns an element.
			getSaveElement( 'core/fruit', { fruit: 'Bananas' }, [
				createBlock( 'core/fruit', { fruit: 'Apples' } ),
			] ) as ReactElement
		);

		expect( saved ).toMatchSnapshot();
	} );

	it( 'should force serialize for invalid block with inner blocks', () => {
		const blockType = {
			apiVersion: 3,
			attributes: {
				throw: {
					type: 'boolean',
				},
				defaulted: {
					type: 'boolean',
					default: false,
				},
				content: {
					type: 'string',
					source: 'text',
				},
				stuff: {
					type: 'string',
				},
			},
			save( { attributes }: { attributes: Record< string, unknown > } ) {
				if ( attributes.throw ) {
					throw new Error();
				}

				return (
					<p>
						{
							// The attribute is a string.
							attributes.content as string
						}
						<InnerBlocks.Content />
					</p>
				);
			},
			category: 'text',
			title: 'block title',
		};
		registerBlockType( 'core/test-block', blockType );
		const block = createBlock( 'core/test-block', { content: 'Invalid' }, [
			createBlock( 'core/test-block' ),
		] );

		block.isValid = false;
		block.originalContent = 'Original';

		expect( serialize( block ) ).toMatchSnapshot();
	} );
} );

describe( 'useInnerBlocksProps', () => {
	// Unregistered once the containers have unmounted.
	beforeAll( () => {
		registerBlockType( 'core/container', {
			apiVersion: 3,
			category: 'text',
			title: 'Container',
			attributes: {},
			save: () => null,
		} );
	} );

	afterAll( () => {
		unregisterBlockType( 'core/container' );
	} );

	// Renders a container with the options, and returns a getter for the
	// block list settings they lead to.
	function renderContainer( options: InnerBlocksOptions ) {
		const block = createBlock( 'core/container' );
		let registry: DataRegistry | undefined;
		function Container() {
			registry = useRegistry();
			return <div { ...useInnerBlocksProps( {}, options ) } />;
		}
		render(
			<BlockEditorProvider value={ [ block ] }>
				<BlockEditContextProvider
					value={ {
						name: 'core/container',
						clientId: block.clientId,
					} }
				>
					<Container />
				</BlockEditContextProvider>
			</BlockEditorProvider>
		);
		return () =>
			registry!
				.select( blockEditorStore )
				.getBlockListSettings( block.clientId );
	}

	it( 'keeps the private options in the block list settings', async () => {
		const getSettings = renderContainer( {
			[ isMoveTransparentKey ]: true,
			[ detachesOnEditKey ]: true,
		} );

		// The settings land in a microtask.
		await waitFor( () => {
			expect( getSettings()?.[ isMoveTransparentKey ] ).toBe( true );
			expect( getSettings()?.[ detachesOnEditKey ] ).toBe( true );
		} );
	} );

	it( 'leaves out the private settings for options under their names', async () => {
		const getSettings = renderContainer( {
			isMoveTransparent: true,
			detachesOnEdit: true,
		} as InnerBlocksOptions );

		await waitFor( () => expect( getSettings() ).toBeDefined() );
		expect( getSettings()?.[ isMoveTransparentKey ] ).toBeUndefined();
		expect( getSettings()?.[ detachesOnEditKey ] ).toBeUndefined();
	} );
} );

/* eslint-enable testing-library/render-result-naming-convention */
