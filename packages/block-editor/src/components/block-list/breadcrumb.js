/**
 * WordPress dependencies
 */
import { Toolbar, Button } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockTitle from '../block-title';

/**
 * Block breadcrumb component, displaying the label of the block. If the block
 * descends from a root block, a button is displayed enabling the user to select
 * the root block.
 *
 * @param {string}   props.clientId        Client ID of block.
 * @return {WPElement} Block Breadcrumb.
 */
const BlockBreadcrumb = forwardRef( ( { clientId }, ref ) => {
	const { setKeyboardMode } = useDispatch( 'core/block-editor' );
	const { rootClientId } = useSelect( ( select ) => {
		return {
			rootClientId: select( 'core/block-editor' ).getBlockRootClientId( clientId ),
		};
	} );

	return (
		<div className={ 'editor-block-list__breadcrumb block-editor-block-list__breadcrumb' }>
			<Toolbar>
				{ rootClientId && (
				<>
					<BlockTitle clientId={ rootClientId } />
					<span className="editor-block-list__descendant-arrow block-editor-block-list__descendant-arrow" />
				</>
				) }
				<Button ref={ ref }onClick={ () => setKeyboardMode( 'edit' ) }>
					<BlockTitle clientId={ clientId } />
				</Button>
			</Toolbar>
		</div>
	);
} );

export default BlockBreadcrumb;
