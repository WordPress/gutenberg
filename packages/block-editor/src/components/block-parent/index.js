/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
  getBlocksByClientId,
  getBlockAttributes,
  getBlockName,
  getBlockType } from '@wordpress/blocks';
import { image } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
import BlockTitle from '../block-title';

/**
 * Block parent component, displaying the hierarchy of the
 * current block selection as a single icon to "go up" a level.
 *
 * @return {WPElement} Block Breadcrumb.
 */
const BlockParent = function() {
  const { selectBlock, clearSelectedBlock } = useDispatch(
		'core/block-editor'
	);
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
			hasSelection: !! getSelectionStart().clientId,
		};
	}, [] );

  const firstParentClientID = parents[parents.length - 1];

  const { parentClientId, parentBlockType } = useSelect( ( select ) => {
    const { getBlockName } = select( 'core/block-editor' );
    const parentBlockName = getBlockName( firstParentClientID )
    return {
      parentBlockType: getBlockType( parentBlockName ),
    };
  }, [] );

  if ( parents && parents.length ) {
    return (
      <div className="block-editor-block-parent" key={ firstParentClientID }>
          <Button
            className="block-editor-block-parent__button"
            onClick={ () => selectBlock( firstParentClientID ) }
            label={ __( 'Select parent block' ) }
            showTooltip
            icon={ <BlockIcon icon={ parentBlockType.icon } /> }
          />
      </div>
    );
  } else {
    return null;
  }
};

export default BlockParent;
