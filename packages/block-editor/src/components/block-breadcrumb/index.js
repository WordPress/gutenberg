/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';

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
const BlockBreadcrumb = function() {
	const { selectBlock } = useDispatch( 'core/block-editor' );
	const { clientId, parents } = useSelect( ( select ) => {
		const selectedBlockClientId = select( 'core/block-editor' ).getSelectedBlockClientId();
		return {
			parents: select( 'core/block-editor' ).getBlockParents( selectedBlockClientId ),
			clientId: selectedBlockClientId,
		};
	}, [] );

	return (
		<ul className="block-editor-block-breadcrumb">
			{ parents.map( ( parent ) => (
				<li key={ parent }>
					<Button
						className="block-editor-block-breadcrumb__button"
						isTertiary
						onClick={ () => selectBlock( parent ) }
					>
						<BlockTitle clientId={ parent } />
					</Button>
				</li>
			) ) }
			{ !! clientId && (
				<li className="block-editor-block-breadcrumb__current">
					<BlockTitle clientId={ clientId } />
				</li>
			) }
		</ul>
	);
};

export default BlockBreadcrumb;
