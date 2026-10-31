import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiFetch from '@wordpress/api-fetch';
import { __unstableSerializeAndClean } from '@wordpress/blocks';
import { saveRecoveryPoint } from '../save-recovery-point';

vi.mock( import( '@wordpress/api-fetch' ) );
vi.mock( import( '@wordpress/blocks' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	__unstableSerializeAndClean: vi.fn(),
} ) );

const AUTOSAVES_PATH = '/wp/v2/posts/1/autosaves';
const SERIALIZED_BLOCKS =
	'<!-- wp:paragraph --><p>Serialized</p><!-- /wp:paragraph -->';

describe( 'saveRecoveryPoint', () => {
	beforeEach( () => {
		vi.mocked( apiFetch ).mockReset();
		vi.mocked( __unstableSerializeAndClean ).mockReturnValue(
			SERIALIZED_BLOCKS
		);
	} );

	it( 'stores the title, excerpt, and serialized blocks as a recovery point', async () => {
		const blocks = [ { name: 'core/paragraph' } ];

		await saveRecoveryPoint( AUTOSAVES_PATH, {
			id: 1,
			title: { raw: 'Lost title' },
			excerpt: 'Lost excerpt',
			blocks,
			// The editor keeps the content as a lazy serializer.
			content: () => '',
		} );

		expect( __unstableSerializeAndClean ).toHaveBeenCalledWith( blocks );
		expect( apiFetch ).toHaveBeenCalledWith( {
			path: AUTOSAVES_PATH,
			method: 'POST',
			data: {
				crdt_recovery_point: true,
				content: SERIALIZED_BLOCKS,
				title: 'Lost title',
				excerpt: 'Lost excerpt',
			},
		} );
	} );

	it( 'falls back to the raw content when the record has no blocks', async () => {
		await saveRecoveryPoint( AUTOSAVES_PATH, {
			id: 1,
			title: 'Lost title',
			content: { raw: '<p>Lost content</p>' },
		} );

		expect( apiFetch ).toHaveBeenCalledWith( {
			path: AUTOSAVES_PATH,
			method: 'POST',
			data: {
				crdt_recovery_point: true,
				content: '<p>Lost content</p>',
				title: 'Lost title',
			},
		} );
	} );

	it( 'stores nothing when the content cannot be derived from the record', async () => {
		await saveRecoveryPoint( AUTOSAVES_PATH, {
			id: 1,
			title: 'Lost title',
			content: () => '<p>Lazy content</p>',
		} );

		expect( apiFetch ).not.toHaveBeenCalled();
	} );
} );
