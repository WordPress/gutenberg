/**
 * WordPress dependencies
 */
import { Toolbar, Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockTitle from '../block-title';

/**
 * Block breadcrumb component, displaying the label of the block. If the block
 * descends from a root block, a button is displayed enabling the user to select
 * the root block.
 *
 * @param {string} props          Component props.
 * @param {string} props.clientId Client ID of block.
 *
 * @return {WPComponent} The component to be rendered.
 */
function BlockBreadcrumb( { clientId, ...props } ) {
	return (
		<div className="block-editor-block-list__breadcrumb" { ...props }>
			<Toolbar>
				<Button>
					<BlockTitle clientId={ clientId } />
				</Button>
			</Toolbar>
		</div>
	);
}

export default BlockBreadcrumb;
