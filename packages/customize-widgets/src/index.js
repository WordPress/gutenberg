/**
 * WordPress dependencies
 */
import { render } from '@wordpress/element';
import {
	registerCoreBlocks,
	__experimentalGetCoreBlocks,
	__experimentalRegisterExperimentalCoreBlocks,
} from '@wordpress/block-library';
import {
	registerLegacyWidgetBlock,
	registerLegacyWidgetVariations,
	registerWidgetGroupBlock,
} from '@wordpress/widgets';
import {
	setFreeformContentHandlerName,
	store as blocksStore,
} from '@wordpress/blocks';
import { dispatch } from '@wordpress/data';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import CustomizeWidgets from './components/customize-widgets';
import getSidebarSection from './controls/sidebar-section';
import getSidebarControl from './controls/sidebar-control';
import './filters';

const { wp } = window;

const DISABLED_BLOCKS = [
	'core/more',
	'core/block',
	'core/freeform',
	'core/template-part',
];
const ENABLE_EXPERIMENTAL_FSE_BLOCKS = false;

/**
 * Initializes the widgets block editor in the customizer.
 *
 * @param {string} editorName          The editor name.
 * @param {Object} blockEditorSettings Block editor settings.
 */
export function initialize( editorName, blockEditorSettings ) {
	dispatch( interfaceStore ).setFeatureDefaults( 'core/customize-widgets', {
		fixedToolbar: false,
		welcomeGuide: true,
	} );

	dispatch( blocksStore ).__experimentalReapplyBlockTypeFilters();
	const coreBlocks = __experimentalGetCoreBlocks().filter( ( block ) => {
		return ! (
			DISABLED_BLOCKS.includes( block.name ) ||
			block.name.startsWith( 'core/post' ) ||
			block.name.startsWith( 'core/query' ) ||
			block.name.startsWith( 'core/site' ) ||
			block.name.startsWith( 'core/navigation' )
		);
	} );
	registerCoreBlocks( coreBlocks );
	registerLegacyWidgetBlock();
	if ( process.env.IS_GUTENBERG_PLUGIN ) {
		__experimentalRegisterExperimentalCoreBlocks( {
			enableFSEBlocks: ENABLE_EXPERIMENTAL_FSE_BLOCKS,
		} );
	}
	registerLegacyWidgetVariations( blockEditorSettings );
	registerWidgetGroupBlock();

	// As we are unregistering `core/freeform` to avoid the Classic block, we must
	// replace it with something as the default freeform content handler. Failure to
	// do this will result in errors in the default block parser.
	// see: https://github.com/WordPress/gutenberg/issues/33097
	setFreeformContentHandlerName( 'core/html' );

	const SidebarControl = getSidebarControl( blockEditorSettings );

	wp.customize.sectionConstructor.sidebar = getSidebarSection();
	wp.customize.controlConstructor.sidebar_block_editor = SidebarControl;

	const container = document.createElement( 'div' );
	document.body.appendChild( container );

	wp.customize.bind( 'ready', () => {
		const sidebarControls = [];
		wp.customize.control.each( ( control ) => {
			if ( control instanceof SidebarControl ) {
				sidebarControls.push( control );
			}
		} );

		render(
			<CustomizeWidgets
				api={ wp.customize }
				sidebarControls={ sidebarControls }
				blockEditorSettings={ blockEditorSettings }
			/>,
			container
		);
	} );
}
