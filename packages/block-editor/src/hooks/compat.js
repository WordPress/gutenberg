/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';

function migrateLightBlockWrapper( settings ) {
	const { apiVersion = 1 } = settings;
	if ( apiVersion < 2 && settings.supports?.lightBlockWrapper ) {
		settings.apiVersion = 2;
	}

	return settings;
}

addFilter(
	'blocks.registerBlockType',
	'core/compat/migrateLightBlockWrapper',
	migrateLightBlockWrapper
);
