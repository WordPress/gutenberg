import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import {
	metadata as descriptionTermMetadata,
	settings as descriptionTermSettings,
} from '../index';
import {
	metadata as descriptionDetailMetadata,
	settings as descriptionDetailSettings,
} from '../../description-detail';
import transforms from '../transforms';

describe( 'description term transforms', () => {
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

	it( 'transforms to a description detail', () => {
		const [ transform ] = transforms.to;
		const block = transform.transform( {
			content: 'Term',
		} );

		expect( block.name ).toBe( 'core/description-detail' );
		expect( block.attributes.content.toHTMLString() ).toBe( 'Term' );
	} );
} );
