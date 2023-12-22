/**
 * External dependencies
 */
import { paramCase as kebabCase } from 'change-case';

/**
 * WordPress dependencies
 */
import { downloadBlob } from '@wordpress/blob';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { PATTERN_TYPES } from '../../utils/constants';

export const exportJSONaction = {
	id: 'duplicate-pattern',
	label: __( 'Export as JSON' ),
	isEligible: ( item ) => item.type === PATTERN_TYPES.user,
	callback: ( item ) => {
		const json = {
			__file: item.type,
			title: item.title || item.name,
			content: item.patternBlock.content.raw,
			syncStatus: item.patternBlock.wp_pattern_sync_status,
		};
		return downloadBlob(
			`${ kebabCase( item.title || item.name ) }.json`,
			JSON.stringify( json, null, 2 ),
			'application/json'
		);
	},
};
