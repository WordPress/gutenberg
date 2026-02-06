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
	withColors,
	store as blockEditorStore,
	RichText,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import {
	RawHTML,
	useRef,
	useCallback,
	useState,
	useEffect,
	useMemo,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import slugFromLabel from '../tab/slug-from-label';
import Controls from './controls';

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
	__unstableLayoutClassNames: layoutClassNames,
} ) {
	// Context from tabs-menu (per-item context via BlockContextProvider)
	const tabIndex = context[ 'core/tabs-menu-item-index' ] ?? 0;
	const tabId = context[ 'core/tabs-menu-item-id' ] ?? '';
	const tabLabel = context[ 'core/tabs-menu-item-label' ] ?? '';
	const tabClientId = context[ 'core/tabs-menu-item-clientId' ] ?? '';

	// Context from parent tabs block, memoized to prevent unnecessary re-renders.
	const contextTabsList = context[ 'core/tabs-list' ];
	const tabsList = useMemo(
		() => contextTabsList || [],
		[ contextTabsList ]
	);
	const activeTabIndex = context[ 'core/tabs-activeTabIndex' ] ?? 0;
	const editorActiveTabIndex = context[ 'core/tabs-editorActiveTabIndex' ];

	// Memoize effectiveActiveIndex to ensure it updates when context changes
	const effectiveActiveIndex = useMemo( () => {
		return editorActiveTabIndex ?? activeTabIndex;
	}, [ editorActiveTabIndex, activeTabIndex ] );

	const isActiveTab = tabIndex === effectiveActiveIndex;

	const { __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );
	const focusRef = useRef();
	const labelElementRef = useRef( null );
	const [ isEditing, setIsEditing ] = useState( false );
	const [ editingLabel, setEditingLabel ] = useState( '' );

	// Get parent tabs clientId for updating editorActiveTabIndex
	const { tabsClientId, tabsMenuClientId, selectedTabClientId } = useSelect(
		( select ) => {
			const {
				getBlockRootClientId,
				getSelectedBlockClientIds,
				hasSelectedInnerBlock,
			} = select( blockEditorStore );
			// tabs-menu-item -> tabs-menu -> tabs
			const _tabsMenuClientId = getBlockRootClientId( clientId );
			const _tabsClientId = _tabsMenuClientId
				? getBlockRootClientId( _tabsMenuClientId )
				: null;

			const selectedIds = getSelectedBlockClientIds();

			// Find if any tab is selected
			let selectedTab = null;
			for ( const tab of tabsList ) {
				if (
					selectedIds.includes( tab.clientId ) ||
					hasSelectedInnerBlock( tab.clientId, true )
				) {
					selectedTab = tab.clientId;
					break;
				}
			}

			return {
				tabsClientId: _tabsClientId,
				tabsMenuClientId: _tabsMenuClientId,
				selectedTabClientId: selectedTab,
			};
		},
		[ clientId, tabsList ]
	);

	const isSelectedTab = tabClientId === selectedTabClientId;

	// Update tab label in the tab block
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const handleLabelChange = useCallback(
		( newLabel ) => {
			if ( tabClientId ) {
				updateBlockAttributes( tabClientId, {
					label: newLabel,
					anchor: slugFromLabel( newLabel, tabIndex ),
				} );
			}
		},
		[ updateBlockAttributes, tabClientId, tabIndex ]
	);

	// Update editor active tab index on parent tabs block when tab is clicked
	const handleTabClick = useCallback(
		( event ) => {
			event.preventDefault();

			// Update the parent tabs block's editorActiveTabIndex (ephemeral, not persisted)
			if ( tabsClientId && tabIndex !== effectiveActiveIndex ) {
				__unstableMarkNextChangeAsNotPersistent();
				updateBlockAttributes( tabsClientId, {
					editorActiveTabIndex: tabIndex,
				} );
			}

			// Don't select block if we're editing this tab's label
			if ( isEditing ) {
			}
		},
		[
			isEditing,
			tabsClientId,
			tabIndex,
			effectiveActiveIndex,
			updateBlockAttributes,
			__unstableMarkNextChangeAsNotPersistent,
		]
	);

	// Callback ref for label RichText
	const labelRef = useCallback(
		( node ) => {
			labelElementRef.current = node;
			if ( node && isEditing ) {
				const animationId = requestAnimationFrame( () => {
					if ( node ) {
						node.focus();
					}
				} );
				focusRef.current = animationId;
			}
		},
		[ isEditing ]
	);

	// Cleanup animation frames
	useEffect( () => {
		return () => {
			if ( focusRef.current ) {
				cancelAnimationFrame( focusRef.current );
			}
		};
	}, [] );

	// Build CSS custom properties for active/hover color states
	const customColorStyles = useMemo( () => {
		const styles = {};

		// Active/hover colors from custom attributes
		const activeBg =
			activeBackgroundColor?.color ||
			attributes.customActiveBackgroundColor;
		const activeText =
			activeTextColor?.color || attributes.customActiveTextColor;
		const hoverBg =
			hoverBackgroundColor?.color ||
			attributes.customHoverBackgroundColor;
		const hoverText =
			hoverTextColor?.color || attributes.customHoverTextColor;

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
		activeBackgroundColor?.color,
		attributes.customActiveBackgroundColor,
		activeTextColor?.color,
		attributes.customActiveTextColor,
		hoverBackgroundColor?.color,
		attributes.customHoverBackgroundColor,
		hoverTextColor?.color,
		attributes.customHoverTextColor,
	] );

	const tabPanelId = tabId || `tab-${ tabIndex }`;
	const tabLabelId = `${ tabPanelId }--tab`;

	// Use blockProps for core style engine support
	const blockProps = useBlockProps( {
		className: clsx( layoutClassNames, {
			'is-active': isActiveTab,
			'is-selected': isSelectedTab,
		} ),
		style: customColorStyles,
		'aria-controls': tabPanelId,
		'aria-selected': isActiveTab,
		id: tabLabelId,
		role: 'tab',
		tabIndex: isActiveTab ? 0 : -1,
		onClick: handleTabClick,
		onDoubleClick: () => {
			setIsEditing( true );
			setEditingLabel( tabLabel || '' );
		},
	} );

	return (
		<>
			<Controls
				{ ...{
					attributes,
					setAttributes,
					clientId,
					tabsClientId,
					tabClientId,
					tabIndex,
					tabsCount: tabsList.length,
					tabsMenuClientId,
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
				{ isEditing ? (
					<RichText
						ref={ labelRef }
						tagName="span"
						withoutInteractiveFormatting
						placeholder={ sprintf(
							/* translators: %d is the tab index + 1 */
							__( 'Tab title %d' ),
							tabIndex + 1
						) }
						value={ decodeEntities( editingLabel ) }
						onChange={ ( value ) => {
							setEditingLabel( value );
							handleLabelChange( value );
						} }
						onBlur={ () => {
							setIsEditing( false );
						} }
					/>
				) : (
					<StaticLabel label={ tabLabel } index={ tabIndex } />
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
