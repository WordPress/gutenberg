/**
 * External dependencies
 */
import { without } from 'lodash';

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { hasBlockSupport } from '@wordpress/blocks';

const SUPPORTED_WIDE_ALIGNMENTS_BLOCKS = [ 'core/cover', 'core/group' ];
const WIDE_ALIGNMENTS = [ 'wide', 'full' ];
const ALIGNMENTS = [ 'left', 'center', 'right' ];

export { AlignmentHookSettingsProvider } from './align.js';

// Used to filter out blocks that don't support wide/full alignment on mobile
addFilter(
	'blocks.registerBlockType',
	'core/react-native-editor/align',
	( settings, name ) => {
		if (
			! SUPPORTED_WIDE_ALIGNMENTS_BLOCKS.includes( name ) &&
			hasBlockSupport( settings, 'align' )
		) {
			const blockAlign = settings.supports.align;

			settings.supports = {
				...settings.supports,
				align: Array.isArray( blockAlign )
					? without( blockAlign, ...WIDE_ALIGNMENTS )
					: blockAlign,
				alignWide: false,
			};
			settings.attributes = {
				...settings.attributes,
				align: {
					type: 'string',
					// Allow for '' since it is used by updateAlignment function
					// in withToolbarControls for special cases with defined default values.
					enum: [ ...ALIGNMENTS, '' ],
				},
			};
		}

		return settings;
	}
);
