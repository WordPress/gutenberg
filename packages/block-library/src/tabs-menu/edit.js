/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	useBlockProps,
	__experimentalUseBorderProps as useBorderProps,
	__experimentalUseColorProps as useColorProps,
	__experimentalGetSpacingClassesAndStyles as useSpacingProps,
	getTypographyClassesAndStyles as useTypographyProps,
	withColors,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { RichText } from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { RawHTML, useRef, useCallback, useState, useEffect, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Controls from './controls';
import AddTabToolbarControl from '../tab/add-tab-toolbar-control';
import slugFromLabel from '../tab/slug-from-label';

const { requestAnimationFrame, cancelAnimationFrame } = window;

function StaticLabel( { label, index } ) {
	if ( label ) {
		return (
			<span>
				<RawHTML>{ decodeEntities( label ) }</RawHTML>
			</span>
		);
	}
	return (
		<span>
			{ sprintf(
				/* translators: %d is the tab index + 1 */
				__( 'Tab %d' ),
				index + 1
			) }
		</span>
	);
}

function Edit( {
	attributes,
	setAttributes,
	context,
	clientId,
	activeBackgroundColor,
	setActiveBackgroundColor,
	activeTextColor,
	setActiveTextColor,
	hoverBackgroundColor,
	setHoverBackgroundColor,
	hoverTextColor,
	setHoverTextColor,
	isSelected,
	__unstableLayoutClassNames: layoutClassNames,
} ) {
	const tabsList = context[ 'core/tabs-list' ] || [];
	const tabsId = context[ 'core/tabs-id' ] || '';

	// Consume tab indices from context
	const activeTabIndex = context[ 'core/tabs-activeTabIndex' ] ?? 0;
	const editorActiveTabIndex = context[ 'core/tabs-editorActiveTabIndex' ];

	// Memoize effectiveActiveIndex to ensure it updates when context changes
	const effectiveActiveIndex = useMemo( () => {
		return editorActiveTabIndex ?? activeTabIndex;
	}, [ editorActiveTabIndex, activeTabIndex ] );

	const { selectBlock } = useDispatch( blockEditorStore );
	const focusRef = useRef();
	const labelElementRef = useRef( null );
	const prevTabsCountRef = useRef( tabsList.length );
	const [ editingTabClientId, setEditingTabClientId ] = useState( null );
	const [ editingLabel, setEditingLabel ] = useState( '' );

	// Get style props using button pattern
	const borderProps = useBorderProps( attributes );
	const colorProps = useColorProps( attributes );
	const spacingProps = useSpacingProps( attributes );
	const typographyProps = useTypographyProps( attributes );

	// Get selection info and parent clientId
	const { selectedTabClientId, tabsClientId } = useSelect(
		( select ) => {
			const { getBlockRootClientId, getSelectedBlockClientIds, hasSelectedInnerBlock } = select( blockEditorStore );
			const _tabsClientId = getBlockRootClientId( clientId );
			const selectedIds = getSelectedBlockClientIds();

			// Find if any tab is selected
			let selectedTab = null;
			for ( const tab of tabsList ) {
				if ( selectedIds.includes( tab.clientId ) || hasSelectedInnerBlock( tab.clientId, true ) ) {
					selectedTab = tab.clientId;
					break;
				}
			}

			return {
				selectedTabClientId: selectedTab,
				tabsClientId: _tabsClientId,
			};
		},
		[ clientId, tabsList ]
	);

	// Update tab label in the tab block and parent tabs block
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	// Update editor active tab index on parent tabs block when tab is clicked
	const handleTabClick = useCallback(
		( index, tabClientId ) => {
			// Update the parent tabs block's editorActiveTabIndex (ephemeral, not persisted)
			if ( tabsClientId && index !== effectiveActiveIndex ) {
				updateBlockAttributes( tabsClientId, { editorActiveTabIndex: index } );
			}

			// Don't select block if we're editing this tab's label (to preserve RichText focus)
			// But we still update editorActiveTabIndex above to keep the tab panel visible
			if ( tabClientId === editingTabClientId ) {
				return;
			}

			// If the tabs-menu is not selected, select it first instead of the tab
			// This allows users to interact with the tabs-menu before drilling into individual tabs
			if ( ! isSelected ) {
				selectBlock( clientId );
				return;
			}

			// Select the tab block
			// if ( tabClientId ) {
			// 	selectBlock( tabClientId );
			// }
		},
		[ editingTabClientId, tabsClientId, effectiveActiveIndex, updateBlockAttributes, selectBlock, isSelected, clientId ]
	);

	const handleLabelChange = useCallback(
		( tabClientId, newLabel, tabIndex ) => {
			updateBlockAttributes( tabClientId, { label: newLabel, anchor: slugFromLabel( newLabel, tabIndex ) } );
		},
		[ updateBlockAttributes ]
	);

	// Callback ref for label RichText
	const labelRef = useCallback(
		( node ) => {
			labelElementRef.current = node;
			if ( node && editingTabClientId ) {
				const animationId = requestAnimationFrame( () => {
					if ( node ) {
						node.focus();
					}
				} );
				focusRef.current = animationId;
			}
		},
		[ editingTabClientId ]
	);

	// Cleanup animation frames
	useEffect( () => {
		return () => {
			if ( focusRef.current ) {
				cancelAnimationFrame( focusRef.current );
			}
		};
	}, [] );

	// Auto-enter edit mode when a new tab is added
	useEffect( () => {
		const prevCount = prevTabsCountRef.current;
		const currentCount = tabsList.length;

		// If a tab was added (count increased)
		if ( currentCount > prevCount && currentCount > 0 ) {
			const lastTab = tabsList[ currentCount - 1 ];
			if ( lastTab ) {
				// Enter edit mode for the new tab's label
				setEditingTabClientId( lastTab.clientId );
				setEditingLabel( lastTab.label || '' );
			}
		}

		prevTabsCountRef.current = currentCount;
	}, [ tabsList ] );

	// Build CSS custom properties for all color states (matching PHP render pattern)
	// Only include properties that have values to preserve CSS fallback defaults
	// Memoize to ensure it recalculates when effectiveActiveIndex changes (forces re-render)
	const customColorStyles = useMemo( () => {
		const styles = {};

		// Base colors from core color supports (inactive state)
		const baseBg = colorProps.style?.backgroundColor;
		const baseText = colorProps.style?.color;

		// Active/hover colors from custom attributes
		const activeBg = activeBackgroundColor?.color || attributes.customActiveBackgroundColor;
		const activeText = activeTextColor?.color || attributes.customActiveTextColor;
		const hoverBg = hoverBackgroundColor?.color || attributes.customHoverBackgroundColor;
		const hoverText = hoverTextColor?.color || attributes.customHoverTextColor;

		// Apply base colors via CSS custom properties (not inline styles)
		if ( baseBg ) {
			styles[ '--tab-bg' ] = baseBg;
		}
		if ( baseText ) {
			styles[ '--tab-text' ] = baseText;
		}
		if ( activeBg ) {
			styles[ '--custom-tab-active-color' ] = activeBg;
		}
		if ( activeText ) {
			styles[ '--custom-tab-active-text-color' ] = activeText;
		}
		if ( hoverBg ) {
			styles[ '--custom-tab-hover-color' ] = hoverBg;
		}
		if ( hoverText ) {
			styles[ '--custom-tab-hover-text-color' ] = hoverText;
		}

		return styles;
	}, [
		colorProps.style?.backgroundColor,
		colorProps.style?.color,
		activeBackgroundColor?.color,
		attributes.customActiveBackgroundColor,
		activeTextColor?.color,
		attributes.customActiveTextColor,
		hoverBackgroundColor?.color,
		attributes.customHoverBackgroundColor,
		hoverTextColor?.color,
		attributes.customHoverTextColor,
		effectiveActiveIndex, // Include to force recalculation when active tab changes
	] );

	const blockProps = useBlockProps( {
		className: clsx( 'wp-block-tabs-menu', 'tabs__list', layoutClassNames ),
		role: 'tablist',
		style: customColorStyles,
	} );

	return (
		<>
			<AddTabToolbarControl
				tabsClientId={ tabsClientId }
				attributes={ attributes }
			/>
			<Controls
				{ ...{
					attributes,
					setAttributes,
					clientId,
					activeBackgroundColor,
					setActiveBackgroundColor,
					activeTextColor,
					setActiveTextColor,
					hoverBackgroundColor,
					setHoverBackgroundColor,
					hoverTextColor,
					setHoverTextColor,
				} }
			/>
			<div { ...blockProps }>
				{ tabsList.map( ( tab, index ) => {
					const isActiveTab = index === effectiveActiveIndex;
					const isSelectedTab = tab.clientId === selectedTabClientId;
					const isEditing = tab.clientId === editingTabClientId;
					const tabPanelId = tab.id || `tab-${ index }`;
					const tabLabelId = `${ tabPanelId }--tab`;

					return (
						<button
							key={ tab.clientId || index }
							aria-controls={ tabPanelId }
							aria-selected={ isActiveTab }
							id={ tabLabelId }
							role="tab"
							className={ clsx(
								'tabs__tab-label',
								// Don't include colorProps.className - the has-*-background-color classes
								// have high specificity that overrides our active/hover state CSS
								borderProps.className,
								typographyProps.className,
								{
									'is-active': isActiveTab,
									'is-selected': isSelectedTab,
								}
							) }
							style={ {
								// Don't spread colorProps.style - colors are handled via CSS custom properties
								// to allow active/hover states to properly override base colors
								...borderProps.style,
								...spacingProps.style,
								...typographyProps.style,
							} }
							tabIndex={ isActiveTab ? 0 : -1 }
							onClick={ ( event ) => {
								event.preventDefault();
								handleTabClick( index, tab.clientId );
							} }
							onDoubleClick={ () => {
								setEditingTabClientId( tab.clientId );
								setEditingLabel( tab.label || '' );
							} }
							onKeyDown={ ( event ) => {
								if ( event.key === 'Enter' && ! event.shiftKey ) {
									event.preventDefault();
									handleTabClick( index, tab.clientId );
								}
							} }
						>
							{ isEditing ? (
								<RichText
									ref={ labelRef }
									tagName="span"
									withoutInteractiveFormatting
									placeholder={ sprintf(
										/* translators: %d is the tab index + 1 */
										__( 'Tab %d…' ),
										index + 1
									) }
									value={ decodeEntities( editingLabel ) }
									onChange={ ( value ) => {
										setEditingLabel( value );
										handleLabelChange( tab.clientId, value, index );
									} }
									onBlur={ () => {
										setEditingTabClientId( null );
									} }
								/>
							) : (
								<StaticLabel
									label={ tab.label }
									index={ index }
								/>
							) }
						</button>
					);
				} ) }
				{ tabsList.length === 0 && (
					<span className="tabs__tab-label tabs__tab-label--placeholder">
						{ __( 'Add tabs to display menu' ) }
					</span>
				) }
			</div>
		</>
	);
}

export default withColors(
	'activeBackgroundColor',
	'activeTextColor',
	'hoverBackgroundColor',
	'hoverTextColor'
)( Edit );
