import { dispatch } from '@wordpress/data';
import {
	receiveFinalizedAttachment,
	consumeFinalizedAttachment,
} from '../finalized-attachments';

jest.mock( '@wordpress/data', () => ( {
	dispatch: jest.fn(),
} ) );

jest.mock( '@wordpress/core-data', () => ( {
	store: 'core',
} ) );

const receiveEntityRecords = jest.fn();

describe( 'receiveFinalizedAttachment', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		( dispatch as unknown as jest.Mock ).mockReturnValue( {
			receiveEntityRecords,
		} );
	} );

	afterEach( () => {
		// Leave no entry behind for the next test.
		consumeFinalizedAttachment( 123 );
	} );

	it( 'receives the record under both queries the editor resolves attachments with', () => {
		const record = { id: 123, media_details: { sizes: { full: {} } } };

		receiveFinalizedAttachment( record );

		expect( receiveEntityRecords ).toHaveBeenCalledTimes( 2 );
		expect( receiveEntityRecords ).toHaveBeenCalledWith(
			'postType',
			'attachment',
			record,
			{ context: 'view' }
		);
		expect( receiveEntityRecords ).toHaveBeenCalledWith(
			'postType',
			'attachment',
			record,
			undefined
		);
	} );

	it( 'receives the record on its own, so list queries are left alone', () => {
		// core-data only merges an item list into a query's results when the
		// received items are an array; a lone record must stay a lone record.
		receiveFinalizedAttachment( { id: 123 } );

		for ( const call of receiveEntityRecords.mock.calls ) {
			expect( Array.isArray( call[ 2 ] ) ).toBe( false );
		}
	} );

	it( 'ignores a response without an ID', () => {
		receiveFinalizedAttachment( {} );
		receiveFinalizedAttachment( undefined as unknown as { id?: number } );

		expect( receiveEntityRecords ).not.toHaveBeenCalled();
	} );
} );

describe( 'consumeFinalizedAttachment', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		( dispatch as unknown as jest.Mock ).mockReturnValue( {
			receiveEntityRecords,
		} );
	} );

	it( 'reports an attachment whose finalized record was received', () => {
		receiveFinalizedAttachment( { id: 456 } );

		expect( consumeFinalizedAttachment( 456 ) ).toBe( true );
	} );

	it( 'reports an attachment that was never finalized', () => {
		expect( consumeFinalizedAttachment( 789 ) ).toBe( false );
	} );

	it( 'forgets the attachment once consumed, so a later upload is not skipped', () => {
		receiveFinalizedAttachment( { id: 456 } );

		expect( consumeFinalizedAttachment( 456 ) ).toBe( true );
		expect( consumeFinalizedAttachment( 456 ) ).toBe( false );
	} );
} );
