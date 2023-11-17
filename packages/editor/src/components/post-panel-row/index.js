/**
 * WordPress dependencies
 */
import { __experimentalHStack as HStack } from '@wordpress/components';
import { forwardRef } from '@wordpress/element';

const PostPanelRow = forwardRef( ( { label, children }, ref ) => {
	return (
		<HStack className="editor-post-panel__row" ref={ ref }>
			<div className="editor-post-panel__row-label">{ label }</div>
			<div className="editor-post-panel__row-control">{ children }</div>
		</HStack>
	);
} );

export default PostPanelRow;
