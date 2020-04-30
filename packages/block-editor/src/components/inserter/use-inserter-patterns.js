/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { cloneBlock } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';

function useInserterPatterns( { onInsert } ) {
	const { patterns } = useSelect( ( select ) => {
		const { getSettings } = select( 'core/block-editor' );
		return {
			patterns: getSettings().__experimentalBlockPatterns,
		};
	}, [] );
	const { createSuccessNotice } = useDispatch( 'core/notices' );
	const onSelectPattern = useCallback( ( pattern, blocks ) => {
		onInsert( map( blocks, ( block ) => cloneBlock( block ) ) );
		createSuccessNotice(
			sprintf(
				/* translators: %s: block pattern title. */
				__( 'Pattern "%s" inserted.' ),
				pattern.title
			),
			{
				type: 'snackbar',
			}
		);
	}, [] );

	return [ patterns, onSelectPattern ];
}

export default useInserterPatterns;
