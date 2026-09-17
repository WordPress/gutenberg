import { describe, expect, it } from 'vitest';
import { isEntityRecordLoaded } from '../';

describe( 'isEntityRecordLoaded', () => {
	it( 'returns false while the entity record is still resolving', () => {
		const selectors = {
			getEntityRecord: () => undefined,
			hasFinishedResolution: () => false,
		};

		expect( isEntityRecordLoaded( selectors, 'post', 1 ) ).toBe( false );
	} );

	it( 'returns true after the entity record has resolved', () => {
		const selectors = {
			getEntityRecord: () => undefined,
			hasFinishedResolution: () => true,
		};

		expect( isEntityRecordLoaded( selectors, 'page', 1 ) ).toBe( true );
	} );

	it( 'returns true when the entity record is available', () => {
		const selectors = {
			getEntityRecord: () => ( { content: 'Saved content' } ),
			hasFinishedResolution: () => false,
		};

		expect( isEntityRecordLoaded( selectors, 'page', 1 ) ).toBe( true );
	} );
} );
