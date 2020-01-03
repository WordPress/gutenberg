/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { name as buttonBlockName } from '../button/';

const ALLOWED_BLOCKS = [ buttonBlockName ];
const BUTTONS_TEMPLATE = [ [ 'core/button' ] ];
const UI_PARTS = {
	hasSelectedUI: false,
};

function ButtonsEdit( { className } ) {
	return (
		<div className={ className }>
			<InnerBlocks
				allowedBlocks={ ALLOWED_BLOCKS }
				template={ BUTTONS_TEMPLATE }
				__experimentalUIParts={ UI_PARTS }
				__experimentalMoverDirection="horizontal"
			/>
		</div>
	);
}

export default ButtonsEdit;
