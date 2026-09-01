import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import {
	metadata as descriptionDetailMetadata,
	settings as descriptionDetailSettings,
} from '../index';
import {
	metadata as descriptionTermMetadata,
	settings as descriptionTermSettings,
} from '../../description-term';
import transforms from '../transforms';

describe( 'description detail transforms', () => {
	beforeAll( () => {
		registerBlockType(
			descriptionDetailMetadata,
			descriptionDetailSettings
		);
		registerBlockType( descriptionTermMetadata, descriptionTermSettings );
	} );

	afterAll( () => {
		unregisterBlockType( descriptionDetailMetadata.name );
		unregisterBlockType( descriptionTermMetadata.name );
	} );

	it( 'transforms to a description term', () => {
		const [ transform ] = transforms.to;
		const block = transform.transform( {
			content: 'Description',
		} );

		expect( block.name ).toBe( 'core/description-term' );
		expect( block.attributes.content.toHTMLString() ).toBe( 'Description' );
	} );
} );
