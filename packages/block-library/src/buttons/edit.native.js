/**
 * WordPress dependencies
 */
import {
	InnerBlocks,
	BlockControls,
	AlignmentToolbar,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { name as buttonBlockName } from '../button/';

const ALLOWED_BLOCKS = [ buttonBlockName ];
const BUTTONS_TEMPLATE = [ [ 'core/button' ] ];
const ALIGNMENT_MAP = {
	left: 'flex-start',
	center: 'center',
	right: 'flex-end',
};

function ButtonsEdit( { isSelected, attributes, setAttributes } ) {
	const { align } = attributes;

	function updateAlignment( nextAlign ) {
		setAttributes( { align: nextAlign } );
	}

	const buttonsStyle = { justifyContent: ALIGNMENT_MAP[ align ] };

	return (
		<>
			<BlockControls>
				<AlignmentToolbar
					isCollapsed={ false }
					value={ align }
					onChange={ updateAlignment }
				/>
			</BlockControls>
			<InnerBlocks
				allowedBlocks={ ALLOWED_BLOCKS }
				template={ BUTTONS_TEMPLATE }
				renderAppender={
					isSelected && InnerBlocks.ButtonsBlockAppender
				}
				__experimentalMoverDirection="horizontal"
				style={ buttonsStyle }
			/>
		</>
	);
}

export default ButtonsEdit;
