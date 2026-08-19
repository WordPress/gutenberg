import { getCollaboratorDisplayName } from '../get-collaborator-display-name';

jest.mock( '@wordpress/i18n', () => ( {
	...jest.requireActual( '@wordpress/i18n' ),
	__: ( text: string ) =>
		'Anonymous User' === text ? 'Translated Anonymous User' : text,
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
