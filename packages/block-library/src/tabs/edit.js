/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
	RichText,
} from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const TABS_TEMPLATE = [
	[ 'core/tab', { label: 'Tab 1' } ],
	[ 'core/tab', { label: 'Tab 2' } ],
];

export default function Edit( { clientId, setAttributes } ) {
	const { innerTabBlocks, selectedTabClientId } = useSelect(
		( select ) => {
			const {
				getBlocks,
				getSelectedBlockClientId,
				hasSelectedInnerBlock,
			} = select( blockEditorStore );
			const innerBlocks = getBlocks( clientId );
			const selectedBlockClientId = getSelectedBlockClientId();
			let selectedTabId = null;

			// Find the first tab that is selected or has selected inner blocks so we can set it as active.
			for ( const block of innerBlocks ) {
				if (
					block.clientId === selectedBlockClientId ||
					hasSelectedInnerBlock( block.clientId, true )
				) {
					selectedTabId = block.clientId;
					break;
				}
			}

			return {
				innerTabBlocks: innerBlocks,
				selectedTabClientId: selectedTabId,
			};
		},
		[ clientId ]
	);

	const { __unstableMarkNextChangeAsNotPersistent, updateBlockAttributes } =
		useDispatch( blockEditorStore );

	const setActiveTab = useCallback(
		( activeTabClientId ) => {
			// Set each inner tab's `isActive` attribute.
			innerTabBlocks.forEach( ( block ) => {
				__unstableMarkNextChangeAsNotPersistent();
				updateBlockAttributes( block.clientId, {
					isActive: block.clientId === activeTabClientId,
				} );
			} );
		},
		[
			innerTabBlocks,
			updateBlockAttributes,
			__unstableMarkNextChangeAsNotPersistent,
		]
	);

	// Set the first tab as active when the editor is loaded.
	useEffect( () => {
		if ( innerTabBlocks?.length ) {
			setActiveTab( innerTabBlocks[ 0 ].clientId );
		}
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps -- set first tab as active when the editor is loaded.

	// Update active tab when selection or blocks change.
	useEffect( () => {
		const hasActiveTab =
			innerTabBlocks &&
			innerTabBlocks.some( ( block ) => block.attributes.isActive );

		if ( selectedTabClientId ) {
			// If an inner tab block is selected, or its inner blocks are selected, it becomes the active tab.
			setActiveTab( selectedTabClientId );
		} else if ( ! hasActiveTab && innerTabBlocks?.length ) {
			// Otherwise, if there's no active tab, default to the first inner tab.
			setActiveTab( innerTabBlocks[ 0 ].clientId );
		}
	}, [ innerTabBlocks, selectedTabClientId, setActiveTab ] );

	/**
	 * Cache data needed for save functions:
	 * - Labels for inner tabs to generate tab list
	 * - tabIndex to save the first tab as active, independent of the editor view
	 */
	useEffect( () => {
		__unstableMarkNextChangeAsNotPersistent();
		setAttributes( {
			innerTabs: innerTabBlocks.map( ( block ) => ( {
				label: block.attributes.label,
				href:
					'#' + ( block.attributes.anchor || block.attributes.slug ),
			} ) ),
		} );

		innerTabBlocks.forEach( ( block, index ) => {
			__unstableMarkNextChangeAsNotPersistent();
			updateBlockAttributes( block.clientId, {
				tabIndex: index,
			} );
		} );
	}, [
		__unstableMarkNextChangeAsNotPersistent,
		innerTabBlocks,
		setAttributes,
		updateBlockAttributes,
	] );

	const blockProps = useBlockProps( { className: 'interactive' } );
	const innerBlockProps = useInnerBlocksProps(
		{
			className: 'wp-block-tabs__content',
		},
		{
			__experimentalCaptureToolbars: true,
			clientId,
			orientation: 'horizontal',
			template: TABS_TEMPLATE,
		}
	);

	return (
		<div { ...blockProps }>
			<ul className="wp-block-tabs__list" role="tablist">
				{ innerTabBlocks.map( ( block ) => {
					const { anchor, isActive, label, slug } = block.attributes;
					const tabIndexAttr = isActive ? 0 : -1;
					const tabPanelId = anchor || slug;
					const tabLabelId = tabPanelId + '--tab';

					return (
						<li
							key={ block.clientId }
							className="wp-block-tabs__list-item"
							role="presentation"
						>
							<a
								aria-controls={ tabPanelId }
								aria-selected={ isActive }
								className="wp-block-tabs__tab-label"
								href={ '#' + tabPanelId }
								id={ tabLabelId }
								onClick={ () => setActiveTab( block.clientId ) }
								role="tab"
								tabIndex={ tabIndexAttr }
							>
								<RichText
									tagName="span"
									onChange={ ( value ) =>
										updateBlockAttributes( block.clientId, {
											label: value,
										} )
									}
									placeholder={ __( 'Add label…' ) }
									value={ label }
									withoutInteractiveFormatting
								/>
							</a>
						</li>
					);
				} ) }
			</ul>

			<div { ...innerBlockProps }></div>
		</div>
	);
}
