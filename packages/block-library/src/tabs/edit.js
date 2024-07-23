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

export default function Edit( { clientId } ) {
	const { innerTabs, selectedTabClientId } = useSelect(
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
				innerTabs: innerBlocks,
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
			innerTabs.forEach( ( block ) => {
				__unstableMarkNextChangeAsNotPersistent();
				updateBlockAttributes( block.clientId, {
					isActive: block.clientId === activeTabClientId,
				} );
			} );
		},
		[
			innerTabs,
			updateBlockAttributes,
			__unstableMarkNextChangeAsNotPersistent,
		]
	);

	useEffect( () => {
		if ( innerTabs?.length ) {
			// Set the first tab as active when the editor is loaded
			setActiveTab( innerTabs[ 0 ].clientId );
		}
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps -- set first tab as active when the editor is loaded.

	useEffect( () => {
		const hasActiveTab =
			innerTabs &&
			innerTabs.some( ( block ) => block.attributes.isActive );

		if ( selectedTabClientId ) {
			// If an inner tab block is selected, or its inner blocks are selected, it becomes the active tab.
			setActiveTab( selectedTabClientId );
		} else if ( ! hasActiveTab && innerTabs?.length ) {
			// Otherwise, if there's no active tab, default to the first inner tab.
			setActiveTab( innerTabs[ 0 ].clientId );
		}
	}, [ innerTabs, selectedTabClientId, setActiveTab ] );

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
				{ innerTabs.map( ( block ) => {
					const isActive = block.attributes.isActive;
					const tabIndex = isActive ? '0' : '-1';

					// TODO: Add unique ids and aria attributes for accessibility.
					// (Try the anchor generation functionality from the heading block?)
					return (
						<li
							key={ block.clientId }
							className="wp-block-tabs__list-item"
							role="presentation"
						>
							<button
								className={ clsx( 'wp-block-tabs__tab', {
									'is-active': isActive,
								} ) }
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
							</button>
						</li>
					);
				} ) }
			</ul>

			<div { ...innerBlockProps }></div>
		</div>
	);
}
