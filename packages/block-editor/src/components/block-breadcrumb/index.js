/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockTitle from '../block-title';

/**
 * Block breadcrumb component, displaying the hierarchy of the current block selection as a breadcrumb.
 *
 * @return {WPElement} Block Breadcrumb.
 */
const BlockBreadcrumb = function() {
	const { selectBlock, clearSelectedBlock } = useDispatch( 'core/block-editor' );
	const { clientId, parents, hasSelection } = useSelect( ( select ) => {
		const {
			getSelectionStart,
			getSelectedBlockClientId,
			getBlockParents,
		} = select( 'core/block-editor' );
		const selectedBlockClientId = getSelectedBlockClientId();
		return {
			parents: getBlockParents( selectedBlockClientId ),
			clientId: selectedBlockClientId,
			hasSelection: getSelectionStart(),
		};
	}, [] );

	return (
		<ul className="block-editor-block-breadcrumb">
			<li>
				<Button
					className="block-editor-block-breadcrumb__button"
					isTertiary
					onClick={ hasSelection ? clearSelectedBlock : null }
				>
					{ __( 'Document' ) }
				</Button>
			</li>
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
