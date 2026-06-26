/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';
import {
	useBlockProps,
	store as blockEditorStore,
	RichText,
	__experimentalUseBorderProps as useBorderProps,
	__experimentalUseColorProps as useColorProps,
	__experimentalGetSpacingClassesAndStyles as getSpacingClassesAndStyles,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TabToolbarControls from '../tab-panel/tab-toolbar-controls';

const EMPTY_ARRAY = [];

function Edit( {
	attributes,
	clientId,
	context,
	__unstableLayoutClassNames: layoutClassNames,
} ) {
	const tabsList = context[ 'core/tabs-list' ] || EMPTY_ARRAY;

	const colorProps = useColorProps( attributes );
	const borderProps = useBorderProps( attributes );
	const spacingProps = getSpacingClassesAndStyles( attributes );

	const {
		tabsClientId,
		tabPanelsClientId,
		editorActiveTabIndex,
		activeTabIndex,
	} = useSelect(
		( select ) => {
			const { getBlockRootClientId, getBlockAttributes, getBlocks } =
				select( blockEditorStore );

			const _tabsClientId = getBlockRootClientId( clientId );
			const tabsAttributes = _tabsClientId
				? getBlockAttributes( _tabsClientId )
				: {};
			const tabPanels = _tabsClientId
				? getBlocks( _tabsClientId ).find(
						( block ) => block.name === 'core/tab-panels'
				  )
				: undefined;

			return {
				tabsClientId: _tabsClientId,
				tabPanelsClientId: tabPanels?.clientId ?? null,
				editorActiveTabIndex: tabsAttributes?.editorActiveTabIndex,
				activeTabIndex: tabsAttributes?.activeTabIndex ?? 0,
			};
		},
		[ clientId ]
	);
	const {
		insertBlock,
		updateBlockAttributes,
		__unstableMarkNextChangeAsNotPersistent,
	} = useDispatch( blockEditorStore );

	const effectiveActiveIndex = editorActiveTabIndex ?? activeTabIndex;

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

	function insertTabAfter( tabIndex ) {
		if ( ! tabPanelsClientId ) {
			return;
		}

		const newIndex = tabIndex + 1;
		insertBlock(
			createBlock( 'core/tab-panel', { label: __( 'Tab' ) } ),
			newIndex,
			tabPanelsClientId,
			false
		);

		// Switch editor active tab to the new tab.
		__unstableMarkNextChangeAsNotPersistent();
		updateBlockAttributes( tabsClientId, {
			editorActiveTabIndex: newIndex,
		} );
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

		const focusButtonAt = ( index ) => {
			window.requestAnimationFrame( () => {
				const buttons = menuRef.current?.querySelectorAll( 'button' );
				const target = buttons?.[ index ];
				if ( ! target ) {
					return;
				}
				const richText = target.querySelector( '[contenteditable]' );
				if ( richText ) {
					richText.focus();
				} else {
					target.focus();
				}
			} );
		};

		focusButtonAt( effectiveActiveIndex );
	}, [ tabsList.length, effectiveActiveIndex ] );

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
									insertTabAfter( index )
								}
							/>
						</button>
					);
				} ) }
			</div>
		</>
	);
}

export default Edit;
