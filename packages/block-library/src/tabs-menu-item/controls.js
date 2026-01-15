/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __, isRTL } from '@wordpress/i18n';
import {
	BlockControls,
	InspectorControls,
	store as blockEditorStore,
	__experimentalColorGradientSettingsDropdown as ColorGradientSettingsDropdown,
	__experimentalUseMultipleOriginColorsAndGradients as useMultipleOriginColorsAndGradients,
} from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarItem, Button } from '@wordpress/components';
import {
	chevronLeft,
	chevronRight,
	chevronUp,
	chevronDown,
} from '@wordpress/icons';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import AddTabToolbarControl from '../tab/add-tab-toolbar-control';
import RemoveTabToolbarControl from '../tab/remove-tab-toolbar-control';

function TabBlockMover( { tabClientId, tabIndex, tabsCount, tabsMenuClientId, tabsClientId } ) {
	const {
		moveBlocksUp,
		moveBlocksDown,
		updateBlockAttributes,
		__unstableMarkNextChangeAsNotPersistent,
	} = useDispatch( blockEditorStore );

	const { tabPanelsClientId, orientation } = useSelect(
		( select ) => {
			const { getBlockRootClientId, getBlockListSettings } =
				select( blockEditorStore );
			return {
				tabPanelsClientId: getBlockRootClientId( tabClientId ),
				orientation:
					getBlockListSettings( tabsMenuClientId )?.orientation || 'horizontal',
			};
		},
		[ tabClientId, tabsMenuClientId ]
	);

	const isFirst = tabIndex === 0;
	const isLast = tabIndex === tabsCount - 1;
	const isHorizontal = orientation === 'horizontal';

	// Icons based on orientation (respects RTL for horizontal)
	const upIcon = isHorizontal
		? isRTL()
			? chevronRight
			: chevronLeft
		: chevronUp;
	const downIcon = isHorizontal
		? isRTL()
			? chevronLeft
			: chevronRight
		: chevronDown;

	// Labels based on orientation
	const upLabel = isHorizontal
		? isRTL()
			? __( 'Move tab right' )
			: __( 'Move tab left' )
		: __( 'Move tab up' );
	const downLabel = isHorizontal
		? isRTL()
			? __( 'Move tab left' )
			: __( 'Move tab right' )
		: __( 'Move tab down' );

	// Handle moving tab and updating active index to follow the moved tab
	const handleMoveUp = () => {
		moveBlocksUp( [ tabClientId ], tabPanelsClientId );
		// Update editorActiveTabIndex to follow the moved tab
		if ( tabsClientId ) {
			__unstableMarkNextChangeAsNotPersistent();
			updateBlockAttributes( tabsClientId, { editorActiveTabIndex: tabIndex - 1 } );
		}
	};

	const handleMoveDown = () => {
		moveBlocksDown( [ tabClientId ], tabPanelsClientId );
		// Update editorActiveTabIndex to follow the moved tab
		if ( tabsClientId ) {
			__unstableMarkNextChangeAsNotPersistent();
			updateBlockAttributes( tabsClientId, { editorActiveTabIndex: tabIndex + 1 } );
		}
	};

	// Don't render if only one tab
	if ( tabsCount <= 1 ) {
		return null;
	}

	return (
		<BlockControls group="parent">
			<ToolbarGroup
				className={ clsx( 'block-editor-block-mover', {
					'is-horizontal': isHorizontal,
				} ) }
			>
				<div className="block-editor-block-mover__move-button-container">
					<ToolbarItem>
						{ ( itemProps ) => (
							<Button
								className={ clsx(
									'block-editor-block-mover-button',
									'is-up-button'
								) }
								icon={ upIcon }
								label={ upLabel }
								disabled={ isFirst }
								onClick={ handleMoveUp }
								{ ...itemProps }
							/>
						) }
					</ToolbarItem>
					<ToolbarItem>
						{ ( itemProps ) => (
							<Button
								className={ clsx(
									'block-editor-block-mover-button',
									'is-down-button'
								) }
								icon={ downIcon }
								label={ downLabel }
								disabled={ isLast }
								onClick={ handleMoveDown }
								{ ...itemProps }
							/>
						) }
					</ToolbarItem>
				</div>
			</ToolbarGroup>
		</BlockControls>
	);
}

export default function Controls( {
	attributes,
	setAttributes,
	clientId,
	tabsClientId,
	tabClientId,
	tabIndex,
	tabsCount,
	tabsMenuClientId,
	activeBackgroundColor,
	setActiveBackgroundColor,
	activeTextColor,
	setActiveTextColor,
	hoverBackgroundColor,
	setHoverBackgroundColor,
	hoverTextColor,
	setHoverTextColor,
} ) {
	const {
		customActiveBackgroundColor,
		customActiveTextColor,
		customHoverBackgroundColor,
		customHoverTextColor,
	} = attributes;

	const colorSettings = useMultipleOriginColorsAndGradients();

	return (
		<>
			<TabBlockMover
				tabClientId={ tabClientId }
				tabIndex={ tabIndex }
				tabsCount={ tabsCount }
				tabsMenuClientId={ tabsMenuClientId }
				tabsClientId={ tabsClientId }
			/>
			<AddTabToolbarControl tabsClientId={ tabsClientId } />
			<RemoveTabToolbarControl tabsClientId={ tabsClientId } />
			<InspectorControls group="color">
				<ColorGradientSettingsDropdown
					settings={ [
						{
							label: __( 'Active Background' ),
							colorValue:
								activeBackgroundColor?.color ??
								customActiveBackgroundColor,
							onColorChange: ( value ) => {
								setActiveBackgroundColor( value );
								setAttributes( {
									customActiveBackgroundColor: value,
								} );
							},
						},
						{
							label: __( 'Active Text' ),
							colorValue:
								activeTextColor?.color ?? customActiveTextColor,
							onColorChange: ( value ) => {
								setActiveTextColor( value );
								setAttributes( {
									customActiveTextColor: value,
								} );
							},
						},
						{
							label: __( 'Hover Background' ),
							colorValue:
								hoverBackgroundColor?.color ??
								customHoverBackgroundColor,
							onColorChange: ( value ) => {
								setHoverBackgroundColor( value );
								setAttributes( {
									customHoverBackgroundColor: value,
								} );
							},
						},
						{
							label: __( 'Hover Text' ),
							colorValue:
								hoverTextColor?.color ?? customHoverTextColor,
							onColorChange: ( value ) => {
								setHoverTextColor( value );
								setAttributes( {
									customHoverTextColor: value,
								} );
							},
						},
					] }
					panelId={ clientId }
					disableCustomColors={ false }
					__experimentalIsRenderedInSidebar
					__next40pxDefaultSize
					{ ...colorSettings }
				/>
			</InspectorControls>
		</>
	);
}
