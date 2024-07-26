/**
 * External dependencies
 */
import clsx from 'clsx';

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

const ALLOWED_FORMATS = [
	'core/bold',
	'core/code',
	'core/image',
	'core/italic',
	'core/keyboard',
	'core/language',
	'core/strikethrough',
	'core/subscript',
	'core/superscript',
	'core/text-color',
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
		setAttributes( {
			innerTabs: innerTabBlocks.map( ( block ) => ( {
				label: block.attributes.label,
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

	const blockProps = useBlockProps();
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
					const isActive = block.attributes.isActive;
					const tabIndex = isActive ? 0 : -1;

					// TODO: Add unique ids and aria attributes for accessibility.
					// (Try the anchor generation functionality from the heading block?)
					return (
						<li
							key={ block.clientId }
							className="wp-block-tabs__list-item"
							role="presentation"
						>
							<a // eslint-disable-line jsx-a11y/anchor-is-valid -- TODO: add tab ids to href
								aria-selected={ isActive }
								className={ clsx( 'wp-block-tabs__tab-label', {
									'is-active': isActive,
								} ) }
								href="#"
								onClick={ () => setActiveTab( block.clientId ) }
								role="tab"
								tabIndex={ tabIndex }
							>
								<RichText
									allowedFormats={ ALLOWED_FORMATS }
									tagName="span"
									onChange={ ( value ) =>
										updateBlockAttributes( block.clientId, {
											label: value,
										} )
									}
									placeholder={ __( 'Add label…' ) }
									value={ block.attributes.label }
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
