/**
 * WordPress dependencies
 */
import { hasBlockSupport } from '@wordpress/blocks';
import { addFilter } from '@wordpress/hooks';

function migrateLightBlockWrapper( settings ) {
	const { apiVersion = 1 } = settings;
	if (
		apiVersion < 2 &&
		hasBlockSupport( settings, 'lightBlockWrapper', false )
	) {
		settings.apiVersion = 2;
	}

	return settings;
}

addFilter(
	'blocks.registerBlockType',
	'core/compat/migrateLightBlockWrapper',
	migrateLightBlockWrapper
);
