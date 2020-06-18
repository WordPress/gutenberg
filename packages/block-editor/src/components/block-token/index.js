/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import InnerBlocks from '../inner-blocks';

const ALLOWED_BLOCKS = [ 'core/token' ];

const BlockToken = ( { className, initialValue, tagName } ) => {
	const [ initialTemplate ] = useState( [
		[ 'core/token', { className, tagName, content: initialValue } ],
	] );

	return (
		<InnerBlocks
			allowedBlocks={ ALLOWED_BLOCKS }
			template={ initialTemplate }
			templateLock="all"
			__experimentalCaptureToolbars
		/>
	);
};

export default BlockToken;
