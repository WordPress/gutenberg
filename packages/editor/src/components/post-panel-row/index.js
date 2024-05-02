/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __experimentalHStack as HStack } from '@wordpress/components';
import { forwardRef } from '@wordpress/element';

const PostPanelRow = forwardRef( ( { className, label, children }, ref ) => {
	return (
		<HStack
			className={ classnames( 'editor-post-panel__row', className ) }
			ref={ ref }
		>
			{ label && (
				<div className="editor-post-panel__row-label">{ label }</div>
			) }
			<div className="editor-post-panel__row-control">{ children }</div>
		</HStack>
	);
} );

export default PostPanelRow;
