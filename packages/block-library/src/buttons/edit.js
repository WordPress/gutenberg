/**
 * WordPress dependencies
 */
import {
	__experimentalAlignmentHookSettingsProvider as AlignmentHookSettingsProvider,
	InnerBlocks,
	__experimentalUseBlockWrapperProps as useBlockWrapperProps,
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
	const blockWrapperProps = useBlockWrapperProps();
	return (
		<AlignmentHookSettingsProvider value={ alignmentHooksSetting }>
			<InnerBlocks
				allowedBlocks={ ALLOWED_BLOCKS }
				__experimentalPassedProps={ blockWrapperProps }
				__experimentalTagName="div"
				template={ BUTTONS_TEMPLATE }
				orientation="horizontal"
			/>
		</AlignmentHookSettingsProvider>
	);
}

export default ButtonsEdit;
