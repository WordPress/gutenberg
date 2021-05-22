/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import useBlockEditorSettings from './use-block-editor-settings.js';

function useNativeBlockEditorSettings( settings, hasTemplate ) {
	const capabilities = settings.capabilities ?? {};
	const editorSettings = useBlockEditorSettings( settings, hasTemplate );

	const supportReusableBlock = capabilities.reusableBlock === true;
	const { reusableBlocks } = useSelect(
		( select ) => ( {
			reusableBlocks: supportReusableBlock
				? select( coreStore ).getEntityRecords(
						'postType',
						'wp_block',
						// Unbounded queries are not supported on native so as a workaround, we set per_page with the maximum value that native version can handle.
						// Related issue: https://github.com/wordpress-mobile/gutenberg-mobile/issues/2661
						{ per_page: 100 }
				  )
				: [],
		} ),
		[ supportReusableBlock ]
	);

	return useMemo(
		() => ( {
			...editorSettings,
			__experimentalReusableBlocks: reusableBlocks,
		} ),
		[ reusableBlocks ]
	);
}

export default useNativeBlockEditorSettings;
