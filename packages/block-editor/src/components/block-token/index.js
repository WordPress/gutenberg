/**
 * Internal dependencies
 */
import { InnerBlocks } from '../inner-blocks';

const BlockToken = ( { type } ) => {
	return (
		<InnerBlocks
			allowedBlocks={ [ 'core/token' ] }
			template={ [ [ 'core/token', { type } ] ] }
			templateLock="all"
			__experimentalCaptureToolbars
		/>
	);
};

export default BlockToken;
