import { useDispatch, useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { MenuItem } from '@wordpress/components';
import { createBlock, getBlockType, hasBlockSupport } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';
import { symbolFilled } from '@wordpress/icons';
import { store as coreStore } from '@wordpress/core-data';
import { privateApis as patternsPrivateApis } from '@wordpress/patterns';
import { unlock } from '../../lock-unlock';

const { CreateTemplatePartModal } = unlock( patternsPrivateApis );

/**
 * Check if the block has reusable support defined.
 *
 * @param {string} blockName Block name to check.
 * @return {boolean} Whether the block supports reusable feature.
 */
export const hasReusableBlockSupport = ( blockName ) => {
	const blockType = getBlockType( blockName );
	const hasParent = blockType && 'parent' in blockType;

	// If the block has a parent, check with false as default, otherwise with true.
	return hasBlockSupport( blockName, 'reusable', ! hasParent );
};

/**
 * @param {Object}   props
 * @param {string[]} [props.clientIds]
 * @param {Array}    [props.blocks]
 */
export default function ConvertToTemplatePart( { clientIds, blocks } ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const { replaceBlocks } = useDispatch( blockEditorStore );
	const { createSuccessNotice } = useDispatch( noticesStore );

	const clientId = clientIds?.[ 0 ];
	const { isBlockBasedTheme, canCreate, selectedBlocks } = useSelect(
		( select ) => {
			const {
				getBlockRootClientId,
				canInsertBlockType,
				getBlocksByClientId,
			} = select( blockEditorStore );

			const rootClientId = clientId
				? getBlockRootClientId( clientId )
				: undefined;

			const currentBlocks =
				blocks ??
				( clientIds ? getBlocksByClientId( clientIds ) : [] ) ??
				[];

			const canConvert =
				currentBlocks.length > 0 &&
				currentBlocks.every(
					( block ) =>
						!! block &&
						block.isValid &&
						hasReusableBlockSupport( block.name )
				);

			return {
				isBlockBasedTheme:
					select( coreStore ).getCurrentTheme()?.is_block_theme,
				canCreate:
					canConvert &&
					canInsertBlockType( 'core/template-part', rootClientId ),
				selectedBlocks: currentBlocks,
			};
		},
		[ clientId, clientIds, blocks ]
	);

	if ( ! isBlockBasedTheme || ! canCreate ) {
		return null;
	}

	const onConvert = async ( templatePart ) => {
		replaceBlocks(
			clientIds,
			createBlock( 'core/template-part', {
				slug: templatePart.slug,
				theme: templatePart.theme,
			} )
		);
		createSuccessNotice( __( 'Template part created.' ), {
			type: 'snackbar',
		} );

		// The modal and this component will be unmounted because of `replaceBlocks` above,
		// so no need to call `closeModal` or `onClose`.
	};

	return (
		<>
			<MenuItem
				icon={ symbolFilled }
				onClick={ () => {
					setIsModalOpen( true );
				} }
				aria-expanded={ isModalOpen }
				aria-haspopup="dialog"
			>
				{ __( 'Create template part' ) }
			</MenuItem>
			{ isModalOpen && (
				<CreateTemplatePartModal
					closeModal={ () => {
						setIsModalOpen( false );
					} }
					blocks={ blocks ?? selectedBlocks }
					onCreate={ onConvert }
				/>
			) }
		</>
	);
}
