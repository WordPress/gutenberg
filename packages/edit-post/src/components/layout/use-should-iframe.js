/**
 * WordPress dependencies
 */
import { store as editorStore } from '@wordpress/editor';
import { useSelect } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const isGutenbergPlugin = globalThis.IS_GUTENBERG_PLUGIN ? true : false;

export function useShouldIframe() {
	const {
		isBlockBasedTheme,
		hasV3BlocksOnly,
		isEditingTemplateOrPattern,
		isZoomOutMode,
		deviceType,
	} = useSelect( ( select ) => {
		const { getEditorSettings, getCurrentPostType, getDeviceType } =
			select( editorStore );
		const { isZoomOut } = unlock( select( blockEditorStore ) );
		const { getBlockTypes } = select( blocksStore );
		const editorSettings = getEditorSettings();
		return {
			isBlockBasedTheme: editorSettings.__unstableIsBlockBasedTheme,
			hasV3BlocksOnly: getBlockTypes().every( ( type ) => {
				return type.apiVersion >= 3;
			} ),
			isEditingTemplateOrPattern: [ 'wp_template', 'wp_block' ].includes(
				getCurrentPostType()
			),
			isZoomOutMode: isZoomOut(),
			deviceType: getDeviceType(),
		};
	}, [] );

	return (
		hasV3BlocksOnly ||
		( isGutenbergPlugin && isBlockBasedTheme ) ||
		isEditingTemplateOrPattern ||
		isZoomOutMode ||
		[ 'Tablet', 'Mobile' ].includes( deviceType )
	);
}
