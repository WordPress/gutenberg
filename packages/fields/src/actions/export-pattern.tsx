/**
 * External dependencies
 */
import { paramCase as kebabCase } from 'change-case';
import { downloadZip } from 'client-zip';

/**
 * WordPress dependencies
 */
import { downloadBlob } from '@wordpress/blob';
import { __ } from '@wordpress/i18n';
import { download } from '@wordpress/icons';
import type { Action } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import type { Pattern } from '../types';
import { getItemTitle } from './utils';

function getJsonFromItem( item: Pattern ) {
	return JSON.stringify(
		{
			__file: item.type,
			title: getItemTitle( item ),
			content:
				typeof item.content === 'string'
					? item.content
					: item.content?.raw,
			syncStatus: item.wp_pattern_sync_status,
		},
		null,
		2
	);
}

const exportPattern: Action< Pattern > = {
	id: 'export-pattern',
	label: __( 'Export as JSON' ),
	icon: download,
	supportsBulk: true,
	isEligible: ( item ) => item.type === 'wp_block',
	callback: async ( items ) => {
		if ( items.length === 1 ) {
			return downloadBlob(
				`${ kebabCase(
					getItemTitle( items[ 0 ] ) || items[ 0 ].slug
				) }.json`,
				getJsonFromItem( items[ 0 ] ),
				'application/json'
			);
		}
		const nameCount: Record< string, number > = {};
		const filesToZip = items.map( ( item ) => {
			const name = kebabCase( getItemTitle( item ) || item.slug );
			nameCount[ name ] = ( nameCount[ name ] || 0 ) + 1;
			return {
				name: `${
					name +
					( nameCount[ name ] > 1
						? '-' + ( nameCount[ name ] - 1 )
						: '' )
				}.json`,
				lastModified: new Date(),
				input: getJsonFromItem( item ),
			};
		} );
		return downloadBlob(
			__( 'patterns-export' ) + '.zip',
			await downloadZip( filesToZip ).blob(),
			'application/zip'
		);
	},
};

/**
 * Export action as JSON for Pattern.
 */
export default exportPattern;
