/**
 * WordPress dependencies
 */
import {
	store as richTextStore,
	unregisterFormatType,
} from '@wordpress/rich-text';
import { select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	registerNoteMentionFormat,
	MENTION_FORMAT_NAME,
} from '../mention-format';

const getFormatType = ( name: string ) =>
	select( richTextStore ).getFormatType( name );

describe( 'registerNoteMentionFormat', () => {
	afterEach( () => {
		if ( getFormatType( MENTION_FORMAT_NAME ) ) {
			unregisterFormatType( MENTION_FORMAT_NAME );
		}
	} );

	it( 'registers a span-based mention format that preserves data-user-id', () => {
		registerNoteMentionFormat();

		const format = getFormatType( MENTION_FORMAT_NAME );
		expect( format ).toMatchObject( {
			name: MENTION_FORMAT_NAME,
			tagName: 'span',
			className: 'wp-note-mention',
			attributes: { id: 'data-user-id' },
		} );
	} );

	it( 'is idempotent (safe to call more than once)', () => {
		const consoleError = jest
			.spyOn( console, 'error' )
			.mockImplementation( () => {} );

		registerNoteMentionFormat();
		registerNoteMentionFormat();

		// The second call should be a no-op rather than a duplicate
		// registration, which would log an error.
		expect( consoleError ).not.toHaveBeenCalled();

		consoleError.mockRestore();
	} );
} );
