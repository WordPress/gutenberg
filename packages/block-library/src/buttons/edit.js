/**
 * WordPress dependencies
 */
import { IconButton } from '@wordpress/components';
import { InnerBlocks } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { useCallback } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { name as buttonBlockName } from '../button/';
import { ButtonEditSettings } from '../button/edit-settings';

const ALLOWED_BLOCKS = [ buttonBlockName ];
const BUTTON_BLOCK_SETTINGS = { urlInPopover: true };
const BUTTONS_TEMPLATE = [ [ 'core/button' ] ];
const UI_PARTS = {
	hasSelectedUI: false,
	hasFocusedUI: false,
	hasHoveredUI: false,
	hasBreadcrumbs: false,
	hasMovers: false,
	hasSpacing: false,
	hasSideInserter: false,
};

function useInsertButton( clientId ) {
	const { insertBlock } = useDispatch( 'core/block-editor' );
	const insertButton = useCallback(
		() => {
			const buttonBlock = createBlock( buttonBlockName );
			insertBlock( buttonBlock, undefined, clientId );
		},
		[ insertBlock, clientId ]
	);
	return useCallback(
		() => {
			return (
				<IconButton
					icon="insert"
					label={ __( 'Add button' ) }
					labelPosition="bottom"
					onClick={ insertButton }
				/>
			);
		},
		[ insertButton ]
	);
}

function ButtonsEdit( { clientId, className } ) {
	const renderAppender = useInsertButton( clientId );
	return (
		<div className={ className }>
			<ButtonEditSettings.Provider value={ BUTTON_BLOCK_SETTINGS }>
				<InnerBlocks
					allowedBlocks={ ALLOWED_BLOCKS }
					renderAppender={ renderAppender }
					template={ BUTTONS_TEMPLATE }
					__experimentalUIParts={ UI_PARTS }
				/>
			</ButtonEditSettings.Provider>
		</div>
	);
}

export default ButtonsEdit;
