import {
	RichText,
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	TextControl,
	ToggleControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState, useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { createBlock } from '@wordpress/blocks';
import { withIgnoreIMEEvents } from '@wordpress/keycodes';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

const DEFAULT_BLOCK = {
	name: 'core/paragraph',
	attributes: {
		placeholder: __( 'Type / to add a hidden block' ),
	},
};

function DetailsEdit( { attributes, setAttributes, clientId, onReplace } ) {
	const { name, showContent, summary, allowedBlocks, placeholder } =
		attributes;
	const blockProps = useBlockProps();

	const hasInnerBlocks = useSelect(
		( select ) => select( blockEditorStore ).getBlockCount( clientId ) > 0,
		[ clientId ]
	);
	const { insertBlock } = useDispatch( blockEditorStore );

	const DetailsAppender = useCallback(
		() => (
			<div
				data-root-client-id={ clientId }
				className="block-editor-default-block-appender"
			>
				<p
					tabIndex={ 0 }
					// eslint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role
					role="button"
					aria-label={ __( 'Add default block' ) }
					className="block-editor-default-block-appender__content"
					style={ { display: 'block' } }
					onClick={ () => {
						insertBlock(
							createBlock( 'core/paragraph', {
								placeholder: __(
									'Type / to add a hidden block'
								),
							} ),
							undefined,
							clientId
						);
					} }
					onKeyDown={ ( event ) => {
						if ( event.key === 'Enter' || event.key === ' ' ) {
							event.preventDefault();
							insertBlock(
								createBlock( 'core/paragraph', {
									placeholder: __(
										'Type / to add a hidden block'
									),
								} ),
								undefined,
								clientId
							);
						}
					} }
				>
					{ __( 'Type / to add a hidden block' ) }
				</p>
			</div>
		),
		[ clientId, insertBlock ]
	);

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		__experimentalCaptureToolbars: true,
		allowedBlocks,
		defaultBlock: DEFAULT_BLOCK,
		directInsert: true,
		renderAppender: hasInnerBlocks ? undefined : DetailsAppender,
	} );
	const [ isOpen, setIsOpen ] = useState( showContent );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	// Check if the inner blocks are selected.
	const hasSelectedInnerBlock = useSelect(
		( select ) =>
			select( blockEditorStore ).hasSelectedInnerBlock( clientId, true ),
		[ clientId ]
	);

	const handleSummaryClick = ( event ) => {
		// Prevent native <details> toggle when clicking or selecting text inside RichText,
		// still allow clicking the <summary> disclosure marker itself to toggle.
		if ( event.target !== event.currentTarget ) {
			event.preventDefault();
		}
	};

	const handleSummaryKeyDown = ( event ) => {
		if ( event.key === 'Enter' && ! event.shiftKey ) {
			setIsOpen( ( prevIsOpen ) => ! prevIsOpen );
			event.preventDefault();
		}
	};

	// Prevent spacebar from toggling <details> while typing.
	const handleSummaryKeyUp = ( event ) => {
		if ( event.key === ' ' ) {
			event.preventDefault();
		}
	};

	return (
		<>
			<InspectorControls>
				<ToolsPanel
					label={ __( 'Settings' ) }
					resetAll={ () => {
						setAttributes( {
							showContent: false,
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						isShownByDefault
						label={ __( 'Open by default' ) }
						hasValue={ () => showContent }
						onDeselect={ () => {
							setAttributes( {
								showContent: false,
							} );
						} }
					>
						<ToggleControl
							label={ __( 'Open by default' ) }
							checked={ showContent }
							onChange={ () =>
								setAttributes( {
									showContent: ! showContent,
								} )
							}
						/>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>
			<InspectorControls group="advanced">
				<TextControl
					label={ __( 'Name attribute' ) }
					value={ name || '' }
					onChange={ ( newName ) =>
						setAttributes( { name: newName } )
					}
					help={ __(
						'Enables multiple Details blocks with the same name attribute to be connected, with only one open at a time.'
					) }
				/>
			</InspectorControls>
			<details
				{ ...innerBlocksProps }
				open={ isOpen || hasSelectedInnerBlock }
				onToggle={ ( event ) => setIsOpen( event.target.open ) }
				name={ name || '' }
			>
				<summary
					onClick={ handleSummaryClick }
					onKeyDown={ withIgnoreIMEEvents( handleSummaryKeyDown ) }
					onKeyUp={ handleSummaryKeyUp }
				>
					<RichText
						identifier="summary"
						aria-label={ __(
							'Write summary. Press Enter to expand or collapse the details.'
						) }
						placeholder={ placeholder || __( 'Write summary…' ) }
						withoutInteractiveFormatting
						value={ summary }
						onChange={ ( newSummary ) =>
							setAttributes( { summary: newSummary } )
						}
						onRemove={
							onReplace ? () => onReplace( [] ) : undefined
						}
					/>
				</summary>
				{ innerBlocksProps.children }
			</details>
		</>
	);
}

export default DetailsEdit;
