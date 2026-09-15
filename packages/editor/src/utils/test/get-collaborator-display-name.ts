import { describe, expect, test, vi } from 'vitest';
import { getCollaboratorDisplayName } from '../get-collaborator-display-name';

vi.mock( import( '@wordpress/i18n' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	__: ( ( text: string ) =>
		'Anonymous User' === text
			? 'Translated Anonymous User'
			: text ) as typeof import('@wordpress/i18n').__,
} ) );

describe( 'getCollaboratorDisplayName', () => {
	test( 'localizes a fallback collaborator name for the current viewer', () => {
		expect(
			getCollaboratorDisplayName( {
				id: null,
				name: 'Anonymous User',
			} )
		).toBe( 'Translated Anonymous User' );
	} );

	test( 'preserves a named collaborator profile name', () => {
		expect(
			getCollaboratorDisplayName( {
				id: 42,
				name: 'Jane Doe',
			} )
		).toBe( 'Jane Doe' );
	} );
} );
