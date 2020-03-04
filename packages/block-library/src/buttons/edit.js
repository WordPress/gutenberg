/**
 * WordPress dependencies
 */
import {
	__experimentalAlignmentHookSettingsProvider as AlignmentHookSettingsProvider,
	InnerBlocks,
	__experimentalBlock as Block,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { name as buttonBlockName } from '../button/';

const ALLOWED_BLOCKS = [ buttonBlockName ];
const BUTTONS_TEMPLATE = [ [ 'core/button' ] ];
const UI_PARTS = {
	hasSelectedUI: false,
};

// Inside buttons block alignment options are not supported.
const alignmentHooksSetting = {
	isEmbedButton: true,
};

function ButtonsEdit( { className } ) {
	return (
		<AlignmentHookSettingsProvider value={ alignmentHooksSetting }>
			<InnerBlocks
				allowedBlocks={ ALLOWED_BLOCKS }
				template={ BUTTONS_TEMPLATE }
				__experimentalUIParts={ UI_PARTS }
				__experimentalMoverDirection="horizontal"
				__experimentalTagName={ Block.div }
				__experimentalPassedProps={ { className } }
			/>
		</AlignmentHookSettingsProvider>
	);
}

export default ButtonsEdit;
