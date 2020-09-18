/**
 * WordPress dependencies
 */
import {
	__experimentalAlignmentHookSettingsProvider as AlignmentHookSettingsProvider,
	InnerBlocks,
	__experimentalUseBlockProps as useBlockProps,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { name as buttonBlockName } from '../button/';

const ALLOWED_BLOCKS = [ buttonBlockName ];
const BUTTONS_TEMPLATE = [ [ 'core/button' ] ];

// Inside buttons block alignment options are not supported.
const alignmentHooksSetting = {
	isEmbedButton: true,
};

function ButtonsEdit() {
	return (
		<div { ...useBlockProps() }>
			<AlignmentHookSettingsProvider value={ alignmentHooksSetting }>
				<InnerBlocks
					allowedBlocks={ ALLOWED_BLOCKS }
					template={ BUTTONS_TEMPLATE }
					orientation="horizontal"
				/>
			</AlignmentHookSettingsProvider>
		</div>
	);
}

export default ButtonsEdit;
