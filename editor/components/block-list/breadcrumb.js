/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/element';
import { Dashicon, Tooltip, Toolbar, Button } from '@wordpress/components';
import { withDispatch, withSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import NavigableToolbar from '../navigable-toolbar';
import BlockTitle from '../block-title';

/**
 * Stops propagation of the given event argument. Assumes that the event has
 * been completely handled and no other listeners should be informed.
 *
 * For the breadcrumb component, this is used for improved interoperability
 * with the block's `onFocus` handler which selects the block, thus conflicting
 * with the intention to select the root block.
 *
 * @param {Event} event Event for which propagation should be stopped.
 */
function stopPropagation( event ) {
	event.stopPropagation();
}

/**
 * Block breadcrumb component, displaying the label of the block. If the block
 * descends from a root block, a button is displayed enabling the user to select
 * the root block.
 *
 * @param {string}   props.uid             UID of block.
 * @param {string}   props.rootUID         UID of block's root.
 * @param {Function} props.selectRootBlock Callback to select root block.
 *
 * @return {WPElement} Breadcrumb element.
 */
function BlockBreadcrumb( { uid, rootUID, selectRootBlock } ) {
	return (
		<NavigableToolbar className="editor-block-breadcrumb">
			<Toolbar>
				{ rootUID && (
					<Tooltip text={ __( 'Select parent block' ) }>
						<Button
							onClick={ selectRootBlock }
							onFocus={ stopPropagation }
						>
							<Dashicon icon="arrow-left" uid={ uid } />
						</Button>
					</Tooltip>
				) }
				<BlockTitle uid={ uid } />
			</Toolbar>
		</NavigableToolbar>
	);
}

export default compose( [
	withSelect( ( select, ownProps ) => {
		const { getBlockRootUID } = select( 'core/editor' );
		const { uid } = ownProps;

		return {
			rootUID: getBlockRootUID( uid ),
		};
	} ),
	withDispatch( ( dispatch, ownProps ) => {
		const { rootUID } = ownProps;
		const { selectBlock } = dispatch( 'core/editor' );

		return {
			selectRootBlock: () => selectBlock( rootUID ),
		};
	} ),
] )( BlockBreadcrumb );
