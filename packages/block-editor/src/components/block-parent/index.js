/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { getBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';

/**
 * Block parent component, displaying the hierarchy of the
 * current block selection as a single icon to "go up" a level.
 *
 * @return {WPElement} Block Breadcrumb.
 */
const BlockParent = function() {
	const { selectBlock } = useDispatch( 'core/block-editor' );
	const { parents } = useSelect( ( select ) => {
		const {
			getSelectionStart,
			getSelectedBlockClientId,
			getBlockParents,
		} = select( 'core/block-editor' );
		const selectedBlockClientId = getSelectedBlockClientId();
		return {
			parents: getBlockParents( selectedBlockClientId ),
			clientId: selectedBlockClientId,
			hasSelection: !! getSelectionStart().clientId,
		};
	}, [] );

	const firstParentClientID = parents[ parents.length - 1 ];

	const { parentBlockType } = useSelect( ( select ) => {
		const { getBlockName } = select( 'core/block-editor' );
		const parentBlockName = getBlockName( firstParentClientID );
		return {
			parentBlockType: getBlockType( parentBlockName ),
		};
	}, [] );

	if ( parents && parents.length ) {
		return (
			<div
				className="block-editor-block-parent"
				key={ firstParentClientID }
			>
				<Button
					className="block-editor-block-parent__button"
					onClick={ () => selectBlock( firstParentClientID ) }
					label={ sprintf(
              __( 'Select %s' ),
               parentBlockType.title
					) }
					showTooltip
					icon={ <BlockIcon icon={ parentBlockType.icon } /> }
				/>
			</div>
		);
	}

	return null;
};

export default BlockParent;
