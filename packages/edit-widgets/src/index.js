/**
 * WordPress dependencies
 */
import {
	parse,
	serialize,
	createBlock,
	registerBlockType,
	unstable__bootstrapServerSideBlockDefinitions, // eslint-disable-line camelcase
} from '@wordpress/blocks';
import '@wordpress/notices';
import { render } from '@wordpress/element';
import {
	registerCoreBlocks,
	__experimentalRegisterExperimentalCoreBlocks,
} from '@wordpress/block-library';

/**
 * Internal dependencies
 */
import './store';
import './hooks';
import { create as createLegacyWidget } from './blocks/legacy-widget';
import * as widgetArea from './blocks/widget-area';
import Layout from './components/layout';
import EmbeddedBlockWidgetEditor from './components/embedded-block-widget-editor';

/**
 * Initializes the block editor in the widgets screen.
 *
 * @param {string} id       ID of the root element to render the screen in.
 * @param {Object} settings Block editor settings.
 */
export function initialize( id, settings ) {
	registerCoreBlocks();
	if ( process.env.GUTENBERG_PHASE === 2 ) {
		__experimentalRegisterExperimentalCoreBlocks( settings );
		registerBlock( createLegacyWidget( settings ) );
		registerBlock( widgetArea );
	}
	render(
		<Layout blockEditorSettings={ settings } />,
		document.getElementById( id )
	);
}

/**
 * Initializes the block editor on widgets.php page and in the widgets Customizer section.
 *
 * @param {string} _        Placeholder for compliance with initialize() signature.
 * @param {Object} settings Block editor settings.
 */
export function initializeEmbeddedBlockWidgetEditors( _, settings ) {
	registerCoreBlocks();
	if ( process.env.GUTENBERG_PHASE === 2 ) {
		__experimentalRegisterExperimentalCoreBlocks( settings );
		registerBlock( createLegacyWidget( settings ) );
		registerBlock( widgetArea );
	}
	window.wp.editWidgets.embedMiniEditor = (
		element,
		serializedBlock,
		onChange
	) => {
		const parsedBlocks = serializedBlock && parse( serializedBlock );
		const innerBlocks = parsedBlocks?.length
			? parsedBlocks
			: [ createBlock( 'core/paragraph', { content: '' } ) ];
		const synchronizeWithTextarea = ( newBlocks ) => {
			onChange( serialize( newBlocks ) );
		};
		render(
			<EmbeddedBlockWidgetEditor
				initialBlocks={ innerBlocks }
				settings={ settings }
				onUpdateBlocks={ synchronizeWithTextarea }
			/>,
			element
		);
	};
}

/**
 * Function to register an individual block.
 *
 * @param {Object} block The block to be registered.
 *
 */
const registerBlock = ( block ) => {
	if ( ! block ) {
		return;
	}
	const { metadata, settings, name } = block;
	if ( metadata ) {
		unstable__bootstrapServerSideBlockDefinitions( { [ name ]: metadata } );
	}
	registerBlockType( name, settings );
};
