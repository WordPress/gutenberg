/**
 * WordPress dependencies
 */
import {
	__experimentalAlignmentHookSettingsProvider as AlignmentHookSettingsProvider,
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
	useBlockProps,
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
	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED_BLOCKS,
		template: BUTTONS_TEMPLATE,
		orientation: 'horizontal',
	} );
	return (
		<AlignmentHookSettingsProvider value={ alignmentHooksSetting }>
			<div { ...innerBlocksProps } />
		</AlignmentHookSettingsProvider>
	);
}

export default ButtonsEdit;
