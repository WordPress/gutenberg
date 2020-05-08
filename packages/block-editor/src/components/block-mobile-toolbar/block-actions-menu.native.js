/**
 * External dependencies
 */
import { Platform } from 'react-native';

/**
 * WordPress dependencies
 */
import { ToolbarButton, Picker } from '@wordpress/components';
import { getBlockType } from '@wordpress/blocks';
import { __, sprintf } from '@wordpress/i18n';
import { withDispatch, withSelect } from '@wordpress/data';
import { withInstanceId, compose } from '@wordpress/compose';
import { moreHorizontalMobile, trash, cog } from '@wordpress/icons';
import { partial, first, castArray, last, compact } from 'lodash';
/**
 * Internal dependencies
 */
import { getMoversSetup } from '../block-mover/mover-description';

const BlockActionsMenu = ( {
	onDelete,
	isStackedHorizontally,
	shouldWrapBlockSettings,
	shouldWrapBlockMover,
	openGeneralSidebar,
	onMoveDown,
	onMoveUp,
	isFirst,
	isLast,
	blockTitle,
} ) => {
	const moversOptions = { keys: [ 'icon', 'actionTitle' ] };

	const {
		icon: { backward: backwardButtonIcon, forward: forwardButtonIcon },
		actionTitle: {
			backward: backwardButtonTitle,
			forward: forwardButtonTitle,
		},
	} = getMoversSetup( isStackedHorizontally, moversOptions );

	const deleteOption = {
		id: 'deleteOption',
		// translators: %s: block title e.g: "Paragraph".
		label: sprintf( __( 'Remove %s' ), blockTitle ),
		value: 'deleteOption',
		icon: trash,
		separated: true,
	};

	const settingsOption = {
		id: 'settingsOption',
		label: __( 'Block Settings' ),
		value: 'settingsOption',
		icon: cog,
	};

	const backwardButtonOption = {
		id: 'backwardButtonOption',
		label: backwardButtonTitle,
		value: 'backwardButtonOption',
		icon: backwardButtonIcon,
		disabled: isFirst,
	};

	const forwardButtonOption = {
		id: 'forwardButtonOption',
		label: forwardButtonTitle,
		value: 'forwardButtonOption',
		icon: forwardButtonIcon,
		disabled: isLast,
	};

	const options = compact( [
		shouldWrapBlockMover && backwardButtonOption,
		shouldWrapBlockMover && forwardButtonOption,
		shouldWrapBlockSettings && settingsOption,
		deleteOption,
	] );

	function onPickerSelect( value ) {
		if ( value === 'deleteOption' ) {
			onDelete();
		} else if ( value === 'settingsOption' ) {
			openGeneralSidebar();
		} else if ( value === 'forwardButtonOption' ) {
			onMoveDown();
		} else if ( value === 'backwardButtonOption' ) {
			onMoveUp();
		}
	}

	const disabledButtonIndices = options
		.map( ( option, index ) => option.disabled && index + 1 )
		.filter( Boolean );

	const accessibilityHintIOS = __(
		'Double tap to open Action Sheet with available options'
	);
	const accessibilityHintAndroid = __(
		'Double tap to open Bottom Sheet with available options'
	);

	return (
		<>
			<ToolbarButton
				title={ __( 'Open Settings' ) }
				onClick={ () => this.picker.presentPicker() }
				icon={ moreHorizontalMobile }
				extraProps={ {
					hint:
						Platform.OS === 'ios'
							? accessibilityHintIOS
							: accessibilityHintAndroid,
				} }
			/>
			<Picker
				ref={ ( instance ) => ( this.picker = instance ) }
				options={ options }
				onChange={ onPickerSelect }
				destructiveButtonIndex={ options.length }
				disabledButtonIndices={ disabledButtonIndices }
				hideCancelButton={ Platform !== 'ios' }
			/>
		</>
	);
};

export default compose(
	withSelect( ( select, { clientIds } ) => {
		const {
			getBlockIndex,
			getBlockRootClientId,
			getBlockOrder,
			getBlockName,
		} = select( 'core/block-editor' );
		const normalizedClientIds = castArray( clientIds );
		const blockName = getBlockName( normalizedClientIds );
		const blockType = getBlockType( blockName );
		const blockTitle = blockType.title;
		const firstClientId = first( normalizedClientIds );
		const rootClientId = getBlockRootClientId( firstClientId );
		const blockOrder = getBlockOrder( rootClientId );
		const firstIndex = getBlockIndex( firstClientId, rootClientId );
		const lastIndex = getBlockIndex(
			last( normalizedClientIds ),
			rootClientId
		);

		return {
			isFirst: firstIndex === 0,
			isLast: lastIndex === blockOrder.length - 1,
			rootClientId,
			blockTitle,
		};
	} ),
	withDispatch( ( dispatch, { clientIds, rootClientId } ) => {
		const { moveBlocksDown, moveBlocksUp } = dispatch(
			'core/block-editor'
		);
		const { openGeneralSidebar } = dispatch( 'core/edit-post' );

		return {
			onMoveDown: partial( moveBlocksDown, clientIds, rootClientId ),
			onMoveUp: partial( moveBlocksUp, clientIds, rootClientId ),
			openGeneralSidebar: () => openGeneralSidebar( 'edit-post/block' ),
		};
	} ),
	withInstanceId
)( BlockActionsMenu );
