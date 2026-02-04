/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	DropdownMenu,
	TextControl,
	ToolbarButton,
	ToolbarGroup,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import {
	BlockControls,
	InspectorControls,
	useBlockProps,
	useBlockEditingMode,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useDispatch } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';
import { IconPlaceholder, InserterModal } from './components';
import { parseIcon } from './utils';
import getIcons from './icons';

/**
 * The edit function for the Icon Block.
 *
 * @param {Object} props All props passed to this function.
 */
export function Edit( props ) {
	const { attributes, setAttributes } = props;
	const { icon, ariaLabel, style } = attributes;

	const [ isInserterOpen, setInserterOpen ] = useState( false );
	const [ iconToDisplay, setIconToDisplay ] = useState();
	const [ allIcons, setAllIcons ] = useState();

	const { __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	const isContentOnlyMode = useBlockEditingMode() === 'contentOnly';

	// Load the icons once.
	useEffect( () => {
		const requestIcons = async () => {
			const iconList = await getIcons();
			setAllIcons( iconList );
		};
		requestIcons();
	}, [] );

	// Update the active icons when it's changed.
	useEffect( () => {
		if ( icon && allIcons ) {
			const selectedIcon = allIcons.find( ( { name } ) => name === icon );
			setIconToDisplay( parseIcon( selectedIcon?.content ) );
		}
	}, [ allIcons, icon ] );

	// Is the width value is 0, reset it to the default value.
	useEffect( () => {
		if (
			! style?.dimensions?.width ||
			parseFloat( style?.dimensions?.width ) === 0
		) {
			// To avoid interfering with undo/redo operations any changes in this
			// effect must not make history and should be preceded by
			// `__unstableMarkNextChangeAsNotPersistent()`.
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( {
				style: { ...style, dimensions: { width: '48px' } },
			} );
		}
	}, [ style, setAttributes, __unstableMarkNextChangeAsNotPersistent ] );

	function resetAll() {
		setAttributes( {
			ariaLabel: undefined,
		} );
	}

	const blockControls = (
		<>
			<BlockControls group={ isContentOnlyMode ? 'inline' : 'other' }>
				<ToolbarButton
					onClick={ () => {
						setInserterOpen( true );
					} }
				>
					{ icon ? __( 'Replace' ) : __( 'Add icon' ) }
				</ToolbarButton>
			</BlockControls>
			{ isContentOnlyMode && icon && (
				// Add some extra controls for content attributes when content only mode is active.
				// With content only mode active, the inspector is hidden, so users need another way
				// to edit these attributes.
				<BlockControls group="other">
					<ToolbarGroup className="components-toolbar-group">
						<DropdownMenu
							icon=""
							popoverProps={ {
								className:
									'outermost-icon-block__replace-popover is-alternate',
							} }
							text={ __( 'Label' ) }
						>
							{ () => (
								<TextControl
									className="wp-block-outermost-icon-block__toolbar_content"
									label={ __( 'Label' ) }
									value={ ariaLabel || '' }
									onChange={ ( value ) =>
										setAttributes( { ariaLabel: value } )
									}
									help={ __(
										'Briefly describe the icon to help screen reader users. Leave blank for decorative icons.'
									) }
									__next40pxDefaultSize
								/>
							) }
						</DropdownMenu>
					</ToolbarGroup>
				</BlockControls>
			) }
		</>
	);
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const inspectorControls = icon && (
		<>
			<InspectorControls group="settings">
				<ToolsPanel
					label={ __( 'Settings' ) }
					resetAll={ resetAll }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						label={ __( 'Label' ) }
						isShownByDefault
						hasValue={ () => !! ariaLabel }
						onDeselect={ () =>
							setAttributes( { label: undefined } )
						}
					>
						<TextControl
							label={ __( 'Label' ) }
							help={ __(
								'Briefly describe the icon to help screen reader users. Leave blank for decorative icons.'
							) }
							value={ ariaLabel || '' }
							onChange={ ( value ) =>
								setAttributes( { ariaLabel: value } )
							}
							__next40pxDefaultSize
						/>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>
		</>
	);

	return (
		<>
			{ blockControls }
			{ inspectorControls }
			<div { ...useBlockProps() }>
				{ icon ? (
					iconToDisplay
				) : (
					<IconPlaceholder
						setInserterOpen={ setInserterOpen }
						attributes={ attributes }
						setAttributes={ setAttributes }
					/>
				) }
			</div>
			{ isInserterOpen && (
				<InserterModal
					icons={ allIcons }
					setInserterOpen={ setInserterOpen }
					attributes={ attributes }
					setAttributes={ setAttributes }
				/>
			) }
		</>
	);
}

export default Edit;
