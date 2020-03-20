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

  if ( parents && parents.length ) {
    return (
      <div key={ firstParentClientID }>
          <Button
            className="block-editor-block-parent__button"
            isTertiary
            onClick={ () => selectBlock( firstParentClientID ) }
          >
            <BlockTitle clientId={ firstParentClientID } />
          </Button>
      </div>
    );
  } else {
    return null;
  }
};

export default BlockParent;
