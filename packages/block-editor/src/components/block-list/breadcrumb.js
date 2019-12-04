/**
 * WordPress dependencies
 */
import { Toolbar, Button } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
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
 * @return {WPComponent} The component to be rendered.
 */
const BlockBreadcrumb = forwardRef( ( { clientId }, ref ) => {
	const { setNavigationMode } = useDispatch( 'core/block-editor' );

	return (
		<div className="editor-block-list__breadcrumb block-editor-block-list__breadcrumb">
			<Toolbar>
				<Button ref={ ref } onClick={ () => setNavigationMode( false ) }>
					<BlockTitle clientId={ clientId } />
				</Button>
			</Toolbar>
		</div>
	);
} );

export default BlockBreadcrumb;
