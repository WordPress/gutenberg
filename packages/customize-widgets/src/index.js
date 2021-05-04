/**
 * WordPress dependencies
 */
import {
	registerCoreBlocks,
	__experimentalGetCoreBlocks,
	__experimentalRegisterExperimentalCoreBlocks,
} from '@wordpress/block-library';
import { registerLegacyWidgetVariations } from '@wordpress/widgets';

/**
 * Internal dependencies
 */
import getSidebarSection from './controls/sidebar-section';
import getSidebarControl from './controls/sidebar-control';
import './filters';

const { wp } = window;

/**
 * Initializes the widgets block editor in the customizer.
 *
 * @param {string} editorName          The editor name.
 * @param {Object} blockEditorSettings Block editor settings.
 */
export function initialize( editorName, blockEditorSettings ) {
	const coreBlocks = __experimentalGetCoreBlocks().filter(
		( block ) => ! [ 'core/more' ].includes( block.name )
	);
	registerCoreBlocks( coreBlocks );

	if ( process.env.GUTENBERG_PHASE === 2 ) {
		__experimentalRegisterExperimentalCoreBlocks( {
			enableLegacyWidgetBlock: true,
		} );
	}

	registerLegacyWidgetVariations( blockEditorSettings );

	wp.customize.sectionConstructor.sidebar = getSidebarSection();
	wp.customize.controlConstructor.sidebar_block_editor = getSidebarControl(
		blockEditorSettings
	);
}
