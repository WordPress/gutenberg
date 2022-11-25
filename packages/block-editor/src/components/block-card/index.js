/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
import { Button } from '@wordpress/components';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import { __, isRTL } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
import { store as blockEditorStore } from '../../store';

function BlockCard( { title, icon, description, blockType, className } ) {
	if ( blockType ) {
		deprecated( '`blockType` property in `BlockCard component`', {
			since: '5.7',
			alternative: '`title, icon and description` properties',
		} );
		( { title, icon, description } = blockType );
	}

	const isOffCanvasNavigationEditorEnabled =
		window?.__experimentalEnableOffCanvasNavigationEditor === true;

	const { closestControllingBlock } = useSelect( ( select ) => {
		const {
			getSelectedBlockClientId,
			getBlockParents,
			areInnerBlocksControlled,
			getBlock,
		} = select( blockEditorStore );

		const _selectedBlockClientId = getSelectedBlockClientId();

		const blockParents = getBlockParents( _selectedBlockClientId, true );

		// Find the first parent that is controlling its inner blocks.
		const closestControllingBlockClientId = blockParents.find(
			( parentBlockClientId ) =>
				areInnerBlocksControlled( parentBlockClientId )
		);

		const _closestControllingBlock = getBlock(
			closestControllingBlockClientId
		);

		return {
			closestControllingBlock: _closestControllingBlock,
		};
	}, [] );

	const { selectBlock } = useDispatch( blockEditorStore );

	// If the selected block is being controlled then show a back button which
	// allows jumping immediately up to the controlling ancestor block.
	// Currently limited to the offcanvas experiment but may be opened up to all
	// blocks which meet the criteria in future.
	const showBackButton =
		isOffCanvasNavigationEditorEnabled &&
		closestControllingBlock?.name !== 'core/template-part' &&
		closestControllingBlock?.name !== 'core/block';

	return (
		<div className={ classnames( 'block-editor-block-card', className ) }>
			{ showBackButton && (
				<Button
					onClick={ () =>
						selectBlock( closestControllingBlock?.clientId )
					}
					label={ __( 'Go to controlling block' ) }
					style={
						// TODO: This style override is also used in ToolsPanelHeader.
						// It should be supported out-of-the-box by Button.
						{ minWidth: 24, padding: 0 }
					}
					icon={ isRTL() ? chevronRight : chevronLeft }
					isSmall
				/>
			) }
			<BlockIcon icon={ icon } showColors />
			<div className="block-editor-block-card__content">
				<h2 className="block-editor-block-card__title">{ title }</h2>
				<span className="block-editor-block-card__description">
					{ description }
				</span>
			</div>
		</div>
	);
}

export default BlockCard;
