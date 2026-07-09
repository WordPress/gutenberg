/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	useBlockProps,
	store as blockEditorStore,
	RichText,
	__experimentalUseBorderProps as useBorderProps,
	__experimentalUseColorProps as useColorProps,
	__experimentalGetSpacingClassesAndStyles as getSpacingClassesAndStyles,
} from '@wordpress/block-editor';
import {
	TextControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useMemo, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TabToolbarControls from '../tabs/tab-toolbar-controls';
import useTabActions from '../tabs/use-tab-actions';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

const EMPTY_ARRAY = [];

function Edit( {
	attributes,
	clientId,
	setAttributes,
	__unstableLayoutClassNames: layoutClassNames,
} ) {
	const { ariaLabel } = attributes;

	const colorProps = useColorProps( attributes );
	const borderProps = useBorderProps( attributes );
	const spacingProps = getSpacingClassesAndStyles( attributes );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	const { tabsClientId, tabPanels, editorActiveTabIndex, activeTabIndex } =
		useSelect(
			( select ) => {
				const { getBlockRootClientId, getBlockAttributes, getBlocks } =
					select( blockEditorStore );

				const rootClientId = getBlockRootClientId( clientId );
				const tabsAttributes = getBlockAttributes( rootClientId );
				const tabPanelsBlock = getBlocks( rootClientId )?.find(
					( block ) => block.name === 'core/tab-panels'
				);

				return {
					tabsClientId: rootClientId,
					tabPanels: tabPanelsBlock?.innerBlocks ?? EMPTY_ARRAY,
					editorActiveTabIndex: tabsAttributes?.editorActiveTabIndex,
					activeTabIndex: tabsAttributes?.activeTabIndex ?? 0,
				};
			},
			[ clientId ]
		);
	const { isBlockSelected, hasSelectedInnerBlock } =
		useSelect( blockEditorStore );
	const { updateBlockAttributes, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );
	const { insertTab, removeTab } = useTabActions( tabsClientId );

	const effectiveActiveIndex = editorActiveTabIndex ?? activeTabIndex;
	const tabsList = useMemo(
		() =>
			tabPanels.map( ( tab ) => ( {
				label: tab.attributes.label || '',
				clientId: tab.clientId,
			} ) ),
		[ tabPanels ]
	);

	function selectTabPanel( tabIndex ) {
		if ( tabsClientId && tabIndex !== effectiveActiveIndex ) {
			__unstableMarkNextChangeAsNotPersistent();
			updateBlockAttributes( tabsClientId, {
				editorActiveTabIndex: tabIndex,
			} );
		}
	}

	function handleLabelChange( tabIndex, newLabel ) {
		const tab = tabsList[ tabIndex ];
		if ( tab?.clientId ) {
			updateBlockAttributes( tab.clientId, { label: newLabel } );
		}
	}

	const menuRef = useRef();
	const prevTabCountRef = useRef( tabsList.length );

	// When tabs are added or removed, focus the appropriate button.
	useEffect( () => {
		const prevCount = prevTabCountRef.current;
		prevTabCountRef.current = tabsList.length;

		if ( ! menuRef.current || tabsList.length === prevCount ) {
			return;
		}

		// Only move focus during active editing, not external data changes.
		if (
			! isBlockSelected( tabsClientId ) &&
			! hasSelectedInnerBlock( tabsClientId, true )
		) {
			return;
		}

		const focusButtonAt = ( index ) => {
			window.requestAnimationFrame( () => {
				const button =
					menuRef.current?.querySelectorAll( 'button' )?.[ index ];
				(
					button?.querySelector( '[contenteditable]' ) ?? button
				)?.focus();
			} );
		};

		focusButtonAt( effectiveActiveIndex );
	}, [
		effectiveActiveIndex,
		hasSelectedInnerBlock,
		isBlockSelected,
		tabsClientId,
		tabsList.length,
	] );

	const blockProps = useBlockProps( {
		role: 'tablist',
		ref: menuRef,
		// Applied manually since this block has no inner blocks for the layout
		// support to add its container classes to.
		className: layoutClassNames,
	} );

	const buttonClassName = clsx( colorProps.className, borderProps.className );

	const buttonStyle = {
		...colorProps.style,
		...borderProps.style,
		...spacingProps.style,
	};

	return (
		<>
			<InspectorControls group="settings">
				<ToolsPanel
					label={ __( 'Settings' ) }
					resetAll={ () =>
						setAttributes( {
							ariaLabel: undefined,
						} )
					}
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						label={ __( 'Label' ) }
						isShownByDefault
						hasValue={ () => !! ariaLabel }
						onDeselect={ () =>
							setAttributes( { ariaLabel: undefined } )
						}
					>
						<TextControl
							label={ __( 'Label' ) }
							help={ __(
								'Briefly describe this tab section for screen reader users. Examples: Event information, Product details, and Account settings.'
							) }
							value={ ariaLabel || '' }
							onChange={ ( value ) =>
								setAttributes( {
									ariaLabel: value || undefined,
								} )
							}
						/>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>
			<TabToolbarControls tabsClientId={ tabsClientId } />
			<div { ...blockProps }>
				{ tabsList.map( ( tab, index ) => {
					const isActive = index === effectiveActiveIndex;
					return (
						<button
							key={ tab.clientId || index }
							type="button"
							role="tab"
							aria-selected={ isActive }
							className={ buttonClassName || undefined }
							style={ buttonStyle }
							tabIndex={ -1 }
							// Activate the matching panel whenever this tab
							// receives focus — whether from a click or the caret
							// moving into the label via the keyboard.
							onFocus={ () => {
								selectTabPanel( index );
							} }
						>
							<RichText
								tagName="span"
								withoutInteractiveFormatting
								placeholder={ __( 'Tab title' ) }
								value={ tab.label }
								onChange={ ( newLabel ) =>
									handleLabelChange( index, newLabel )
								}
								__unstableOnSplitAtEnd={ () =>
									insertTab( index + 1 )
								}
								onRemove={ () => removeTab( index ) }
							/>
						</button>
					);
				} ) }
			</div>
		</>
	);
}

export default Edit;
