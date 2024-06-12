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
import { privateApis as patternsPrivateApis } from '@wordpress/patterns';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

// Patterns.
const { PATTERN_TYPES } = unlock( patternsPrivateApis );

function getJsonFromItem( item ) {
	return JSON.stringify(
		{
			__file: item.type,
			title: item.title || item.name,
			content: item.patternPost.content.raw,
			syncStatus: item.patternPost.wp_pattern_sync_status,
		},
		null,
		2
	);
}

export const exportPatternAsJSONAction = {
	id: 'export-pattern',
	label: __( 'Export as JSON' ),
	supportsBulk: true,
	isEligible: ( item ) => {
		if ( ! item.type ) {
			return false;
		}
		return item.type === PATTERN_TYPES.user;
	},
	callback: async ( items ) => {
		if ( items.length === 1 ) {
			return downloadBlob(
				`${ kebabCase( items[ 0 ].title || items[ 0 ].name ) }.json`,
				getJsonFromItem( items[ 0 ] ),
				'application/json'
			);
		}
		const nameCount = {};
		const filesToZip = items.map( ( item ) => {
			const name = kebabCase( item.title || item.name );
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
