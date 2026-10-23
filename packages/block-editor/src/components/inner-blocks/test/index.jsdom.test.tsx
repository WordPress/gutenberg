/* eslint-disable testing-library/render-result-naming-convention */

import type { ReactElement } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import {
	createBlock,
	getBlockTypes,
	getSaveElement,
	registerBlockType,
	serialize,
	unregisterBlockType,
} from '@wordpress/blocks';
import { renderToString } from '@wordpress/element';
import InnerBlocks from '../';

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

/* eslint-enable testing-library/render-result-naming-convention */
