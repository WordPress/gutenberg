/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import {
	ToggleControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

export default function Edit( {
	attributes,
	clientId,
	setAttributes,
	context,
} ) {
	const { openByDefault } = attributes;
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	const { isSelected, getBlockOrder } = useSelect(
		( select ) => {
			const {
				isBlockSelected,
				hasSelectedInnerBlock,
				getBlockOrder: getBlockOrderSelector,
			} = select( blockEditorStore );
			return {
				isSelected:
					isBlockSelected( clientId ) ||
					hasSelectedInnerBlock( clientId, true ),
				getBlockOrder: getBlockOrderSelector,
			};
		},
		[ clientId ]
	);

	const contentBlockClientId = getBlockOrder( clientId )[ 1 ];
	const { updateBlockAttributes, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	useEffect( () => {
		if ( contentBlockClientId ) {
			__unstableMarkNextChangeAsNotPersistent();
			updateBlockAttributes( contentBlockClientId, {
				isSelected,
			} );
		}
	}, [
		isSelected,
		contentBlockClientId,
		__unstableMarkNextChangeAsNotPersistent,
		updateBlockAttributes,
	] );

	const blockProps = useBlockProps( {
		className: clsx( {
			'is-open': openByDefault || isSelected,
		} ),
	} );

	// Get heading level from context.
	const headingLevel = context && context[ 'core/accordion-heading-level' ];
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: [
			[
				'core/accordion-heading',
				headingLevel ? { level: headingLevel } : {},
			],
			[
				'core/accordion-panel',
				{
					openByDefault,
				},
			],
		],
		templateLock: 'all',
		directInsert: true,
		templateInsertUpdatesSelection: true,
	} );

	return (
		<>
			<InspectorControls key="setting">
				<ToolsPanel
					label={ __( 'Settings' ) }
					resetAll={ () => {
						setAttributes( { openByDefault: false } );
						if ( contentBlockClientId ) {
							updateBlockAttributes( contentBlockClientId, {
								openByDefault: false,
							} );
						}
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						label={ __( 'Open by default' ) }
						isShownByDefault
						hasValue={ () => !! openByDefault }
						onDeselect={ () => {
							setAttributes( { openByDefault: false } );
							if ( contentBlockClientId ) {
								updateBlockAttributes( contentBlockClientId, {
									openByDefault: false,
								} );
							}
						} }
					>
						<ToggleControl
							label={ __( 'Open by default' ) }
							__nextHasNoMarginBottom
							onChange={ ( value ) => {
								setAttributes( {
									openByDefault: value,
								} );
								if ( contentBlockClientId ) {
									updateBlockAttributes(
										contentBlockClientId,
										{
											openByDefault: value,
										}
									);
								}
							} }
							checked={ openByDefault }
							help={ __(
								'Accordion content will be displayed by default.'
							) }
						/>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>
			<div { ...innerBlocksProps } />
		</>
	);
}
