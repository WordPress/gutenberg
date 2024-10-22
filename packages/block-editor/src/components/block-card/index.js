/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
import {
	Button,
	__experimentalText as Text,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import { __, isRTL, sprintf } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
import { store as blockEditorStore } from '../../store';

function BlockCard( { title, icon, description, blockType, className, name } ) {
	if ( blockType ) {
		deprecated( '`blockType` property in `BlockCard component`', {
			since: '5.7',
			alternative: '`title, icon and description` properties',
		} );
		( { title, icon, description } = blockType );
	}

	const { parentNavBlockClientId } = useSelect( ( select ) => {
		const { getSelectedBlockClientId, getBlockParentsByBlockName } =
			select( blockEditorStore );

		const _selectedBlockClientId = getSelectedBlockClientId();

		return {
			parentNavBlockClientId: getBlockParentsByBlockName(
				_selectedBlockClientId,
				'core/navigation',
				true
			)[ 0 ],
		};
	}, [] );

	const { selectBlock } = useDispatch( blockEditorStore );

	return (
		<div className={ clsx( 'block-editor-block-card', className ) }>
			{ parentNavBlockClientId && ( // This is only used by the Navigation block for now. It's not ideal having Navigation block specific code here.
				<Button
					onClick={ () => selectBlock( parentNavBlockClientId ) }
					label={ __( 'Go to parent Navigation block' ) }
					style={
						// TODO: This style override is also used in ToolsPanelHeader.
						// It should be supported out-of-the-box by Button.
						{ minWidth: 24, padding: 0 }
					}
					icon={ isRTL() ? chevronRight : chevronLeft }
					size="small"
				/>
			) }
			<BlockIcon icon={ icon } showColors />
			<VStack spacing={ 1 }>
				<h2 className="block-editor-block-card__title">
					{ name?.length
						? sprintf(
								// translators:  %1$s: Custom block name. %2$s: Block title.
								__( '%1$s (%2$s)' ),
								name,
								title
						  )
						: title }
				</h2>
				{ description && (
					<Text className="block-editor-block-card__description">
						{ description }
					</Text>
				) }
			</VStack>
		</div>
	);
}

export default BlockCard;
