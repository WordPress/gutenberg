import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { RichTextData } from '@wordpress/rich-text';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import { TAB } from '@wordpress/keycodes';
import {
	metadata as descriptionTermMetadata,
	settings as descriptionTermSettings,
} from '../index';
import {
	metadata as descriptionDetailMetadata,
	settings as descriptionDetailSettings,
} from '../../description-detail';
import { transformDescriptionListItem } from '../use-keyboard-transform';

function createTabEvent( { shiftKey = false } = {} ) {
	return {
		keyCode: TAB,
		shiftKey,
		altKey: false,
		metaKey: false,
		ctrlKey: false,
		defaultPrevented: false,
		preventDefault: vi.fn(),
	};
}

function setupTransform( { blockName, content, event } ) {
	const replaceBlock = vi.fn();
	const selectionChange = vi.fn();
	const result = transformDescriptionListItem( {
		attributes: {
			content,
		},
		blockName,
		clientId: 'source-client-id',
		event,
		replaceBlock,
		selectionChange,
		selectionStart: {
			offset: 4,
		},
	} );

	return { replaceBlock, result, selectionChange };
}

describe( 'description term and detail keyboard transforms', () => {
	beforeAll( () => {
		registerBlockType( descriptionTermMetadata, descriptionTermSettings );
		registerBlockType(
			descriptionDetailMetadata,
			descriptionDetailSettings
		);
	} );

	afterAll( () => {
		unregisterBlockType( descriptionTermMetadata.name );
		unregisterBlockType( descriptionDetailMetadata.name );
	} );

	it( 'transforms a description term into a description detail on Tab', () => {
		const event = createTabEvent();
		const { replaceBlock, result } = setupTransform( {
			blockName: 'core/description-term',
			content: RichTextData.fromPlainText( 'Term' ),
			event,
		} );

		expect( result ).toBe( true );
		expect( event.preventDefault ).toHaveBeenCalled();
		expect( replaceBlock ).toHaveBeenCalledWith(
			'source-client-id',
			expect.objectContaining( {
				name: 'core/description-detail',
			} )
		);
	} );

	it( 'preserves term content when transforming on Tab', () => {
		const { replaceBlock } = setupTransform( {
			blockName: 'core/description-term',
			content: RichTextData.fromHTMLString(
				'<strong>Formatted term</strong>'
			),
			event: createTabEvent(),
		} );
		const transformedBlock = replaceBlock.mock.calls[ 0 ][ 1 ];

		expect( transformedBlock.attributes.content.toHTMLString() ).toBe(
			'<strong>Formatted term</strong>'
		);
	} );

	it( 'transforms a description detail into a description term on Shift+Tab', () => {
		const event = createTabEvent( { shiftKey: true } );
		const { replaceBlock, result } = setupTransform( {
			blockName: 'core/description-detail',
			content: RichTextData.fromPlainText( 'Description' ),
			event,
		} );

		expect( result ).toBe( true );
		expect( event.preventDefault ).toHaveBeenCalled();
		expect( replaceBlock ).toHaveBeenCalledWith(
			'source-client-id',
			expect.objectContaining( {
				name: 'core/description-term',
			} )
		);
	} );

	it( 'preserves detail content when transforming on Shift+Tab', () => {
		const { replaceBlock } = setupTransform( {
			blockName: 'core/description-detail',
			content: RichTextData.fromHTMLString(
				'<em>Formatted description</em>'
			),
			event: createTabEvent( { shiftKey: true } ),
		} );
		const transformedBlock = replaceBlock.mock.calls[ 0 ][ 1 ];

		expect( transformedBlock.attributes.content.toHTMLString() ).toBe(
			'<em>Formatted description</em>'
		);
	} );

	it( 'does not transform a description term on Shift+Tab', () => {
		const event = createTabEvent( { shiftKey: true } );
		const { replaceBlock, result } = setupTransform( {
			blockName: 'core/description-term',
			content: RichTextData.fromPlainText( 'Term' ),
			event,
		} );

		expect( result ).toBe( false );
		expect( event.preventDefault ).not.toHaveBeenCalled();
		expect( replaceBlock ).not.toHaveBeenCalled();
	} );

	it( 'does not transform a description detail on Tab', () => {
		const event = createTabEvent();
		const { replaceBlock, result } = setupTransform( {
			blockName: 'core/description-detail',
			content: RichTextData.fromPlainText( 'Description' ),
			event,
		} );

		expect( result ).toBe( false );
		expect( event.preventDefault ).not.toHaveBeenCalled();
		expect( replaceBlock ).not.toHaveBeenCalled();
	} );
} );
