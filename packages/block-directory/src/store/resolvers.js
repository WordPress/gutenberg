import { camelCase } from 'change-case';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { fetchDownloadableBlocks, receiveDownloadableBlocks } from './actions';

export const getDownloadableBlocks =
	( filterValue ) =>
	async ( { dispatch } ) => {
		if ( ! filterValue ) {
			return;
		}

		try {
			dispatch( fetchDownloadableBlocks( filterValue ) );
			const results = await apiFetch( {
				path: addQueryArgs( 'wp/v2/block-directory/search', {
					term: filterValue,
				} ),
			} );
			const blocks = results.map( ( result ) =>
				Object.fromEntries(
					Object.entries( result ).map( ( [ key, value ] ) => [
						camelCase( key ),
						value,
					] )
				)
			);

			dispatch( receiveDownloadableBlocks( blocks, filterValue ) );
		} catch {
			dispatch( receiveDownloadableBlocks( [], filterValue ) );
		}
	};
