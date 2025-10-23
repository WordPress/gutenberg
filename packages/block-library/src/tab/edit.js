/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	useInnerBlocksProps,
	getTypographyClassesAndStyles as useTypographyProps,
	__experimentalUseColorProps as useColorProps,
	store as blockEditorStore,
	RichText,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	useMemo,
	useRef,
	useEffect,
	useCallback,
	useState,
} from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
/**
 * Internal dependencies
 */
import { TabFill, TabsListSlot } from './slotfill';
import Controls from './controls';
import slugFromLabel from './slug-from-label';

const TEMPLATE = [
	[
		'core/paragraph',
		{
			placeholder: __( 'Type / to add a block to tab' ),
		},
	],
];

const { requestAnimationFrame, cancelAnimationFrame } = window;

export default function Edit( {
	attributes,
	clientId,
	isSelected,
	setAttributes,
	__unstableLayoutClassNames: layoutClassNames,
} ) {
	const { selectBlock } = useDispatch( blockEditorStore );

	const innerBlocksRef = useRef( null );
	const focusRef = useRef();
	const [ isInitialMount, setIsInitialMount ] = useState( true );
	const labelElementRef = useRef( null );

	const { anchor, label } = attributes;

	// Callback ref that stores the element and focuses on initial mount.
	const labelRef = useCallback(
		( node ) => {
			labelElementRef.current = node;
			if ( node && isInitialMount ) {
				// Focus immediately when ref is set on initial mount.
				const animationId = requestAnimationFrame( () => {
					if ( node ) {
						node.focus();
					}
				} );
				focusRef.current = animationId;
				setIsInitialMount( false );
			}
		},
		[ isInitialMount ]
	);

	// Focus the label RichText component when no label exists (after initial mount).
	useEffect( () => {
		if ( ! label && ! isInitialMount && labelElementRef.current ) {
			const animationId = requestAnimationFrame( () => {
				if ( labelElementRef.current ) {
					labelElementRef.current.focus();
				}
			} );
			focusRef.current = animationId;
			return () => cancelAnimationFrame( focusRef.current );
		}
	}, [ label, isInitialMount ] );

	// Clean up animation frames on unmount.
	useEffect( () => {
		return () => {
			if ( focusRef.current ) {
				cancelAnimationFrame( focusRef.current );
			}
		};
	}, [] );

	const {
		blockIndex,
		hasInnerBlocksSelected,
		tabsHasSelectedBlock,
		tabsClientId,
		tabsAttributes,
		forceDisplay,
		isTabsClientSelected,
		isDefaultTab,
	} = useSelect(
		( select ) => {
			const {
				getBlockRootClientId,
				getBlockIndex,
				isBlockSelected,
				hasSelectedInnerBlock,
				getBlockAttributes,
			} = select( blockEditorStore );

			// Get data from core/tabs.
			const rootClientId = getBlockRootClientId( clientId );
			const hasTabSelected = hasSelectedInnerBlock( rootClientId, true );
			const rootAttributes = getBlockAttributes( rootClientId );
			const { activeTabIndex } = rootAttributes;
			const _isTabsClientSelected = isBlockSelected( rootClientId );

			// Get data about this instance of core/tab.
			const _blockIndex = getBlockIndex( clientId );
			const _isDefaultTab = activeTabIndex === _blockIndex;
			const _hasInnerBlocksSelected = hasSelectedInnerBlock(
				clientId,
				true
			);

			return {
				blockIndex: _blockIndex,
				hasInnerBlocksSelected: _hasInnerBlocksSelected,
				tabsClientId: rootClientId,
				forceDisplay: _isDefaultTab && _isTabsClientSelected,
				tabsHasSelectedBlock: hasTabSelected,
				isTabsClientSelected: _isTabsClientSelected,
				isDefaultTab: _isDefaultTab,
				tabsAttributes: rootAttributes,
			};
		},
		[ clientId ]
	);

	/**
	 * This hook determines if the current tab is selected. This is true if it is the active tab, or if it is selected directly.
	 */
	const isSelectedTab = useMemo( () => {
		if ( isSelected || hasInnerBlocksSelected || forceDisplay ) {
			return true;
		}
		if (
			isDefaultTab &&
			! isTabsClientSelected &&
			! isSelected &&
			! tabsHasSelectedBlock
		) {
			return true;
		}
		return false;
	}, [
		isSelected,
		hasInnerBlocksSelected,
		forceDisplay,
		isDefaultTab,
		isTabsClientSelected,
		tabsHasSelectedBlock,
	] );

	// Use a custom anchor, if set. Otherwise fall back to the slug generated from the label text.
	const tabPanelId = useMemo(
		() => anchor || slugFromLabel( label, blockIndex ),
		[ anchor, label, blockIndex ]
	);
	const tabLabelId = useMemo( () => `${ tabPanelId }--tab`, [ tabPanelId ] );

	const tabItemColorProps = useColorProps( tabsAttributes );
	const tabContentTypographyProps = useTypographyProps( attributes );

	const blockProps = useBlockProps( {
		hidden: ! isSelectedTab,
	} );

	const innerBlocksProps = useInnerBlocksProps(
		{
			'aria-labelledby': tabLabelId,
			id: tabPanelId,
			role: 'tabpanel',
			ref: innerBlocksRef,
			tabIndex: isSelectedTab ? 0 : -1,
			className: clsx(
				tabContentTypographyProps.className,
				'tabs__tab-editor-content',
				layoutClassNames
			),
			style: {
				...tabContentTypographyProps.style,
			},
		},
		{
			template: TEMPLATE,
		}
	);

	return (
		<>
			<div { ...blockProps }>
				<Controls
					attributes={ attributes }
					setAttributes={ setAttributes }
					tabsClientId={ tabsClientId }
					blockIndex={ blockIndex }
					isDefaultTab={ isDefaultTab }
				/>
				<TabFill tabsClientId={ tabsClientId }>
					<button
						aria-controls={ tabPanelId }
						aria-selected={ isSelectedTab }
						id={ tabLabelId }
						role="tab"
						className={ clsx(
							'tabs__tab-label',
							tabItemColorProps.className
						) }
						style={ {
							...tabItemColorProps.style,
						} }
						tabIndex={ -1 }
						onClick={ ( event ) => {
							event.preventDefault();
							selectBlock( clientId );
						} }
						onKeyDown={ ( event ) => {
							// If shift is also pressed, do not select the block.
							if ( event.key === 'Enter' && ! event.shiftKey ) {
								event.preventDefault();
								selectBlock( clientId );
								focusRef.current = requestAnimationFrame(
									() => {
										labelElementRef.current?.focus();
									}
								);
							}
						} }
					>
						<RichText
							ref={ labelRef }
							tagName="span"
							allowedFormats={ [
								'core/bold',
								'core/italic',
								'core/strikethrough',
							] }
							placeholder={
								__( 'Tab' ) + ` ${ blockIndex + 1 }…`
							}
							value={ decodeEntities( label ) }
							onChange={ ( value ) =>
								setAttributes( {
									label: value,
									anchor: slugFromLabel( value, blockIndex ),
								} )
							}
						/>
					</button>
				</TabFill>
				{ isSelectedTab && (
					<>
						<TabsListSlot tabsClientId={ tabsClientId } />
						<section { ...innerBlocksProps } />
					</>
				) }
			</div>
		</>
	);
}
