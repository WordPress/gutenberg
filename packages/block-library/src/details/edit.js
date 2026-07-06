/**
 * WordPress dependencies
 */
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
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import {
	isHorizontalEdge,
	isTextField,
	placeCaretAtHorizontalEdge,
} from '@wordpress/dom';
import { __ } from '@wordpress/i18n';
import { useRef, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';
import { unlock } from '../lock-unlock';

const { withIgnoreIMEEvents } = unlock( componentsPrivateApis );

const TEMPLATE = [
	[
		'core/paragraph',
		{
			placeholder: __( 'Type / to add a hidden block' ),
		},
	],
];

function DetailsEdit( { attributes, setAttributes, clientId, onRemove } ) {
	const { name, showContent, summary, allowedBlocks, placeholder } =
		attributes;
	const summaryRef = useRef();
	const { getBlockOrder, getSelectionStart } = useSelect( blockEditorStore );

	const handleDetailsKeyDownCapture = ( event ) => {
		const { key, target } = event;

		if (
			event.defaultPrevented ||
			key !== 'Backspace' ||
			! isTextField( target ) ||
			! isHorizontalEdge( target, true )
		) {
			return;
		}

		const shouldMoveToSummary =
			summaryRef.current &&
			! summaryRef.current.contains( target ) &&
			getSelectionStart()?.clientId === getBlockOrder( clientId )[ 0 ];

		if ( ! shouldMoveToSummary ) {
			return;
		}

		event.preventDefault();
		placeCaretAtHorizontalEdge( summaryRef.current, true );
	};

	const blockProps = useBlockProps( {
		onKeyDownCapture: handleDetailsKeyDownCapture,
	} );
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: TEMPLATE,
		__experimentalCaptureToolbars: true,
		allowedBlocks,
	} );
	const [ isOpen, setIsOpen ] = useState( showContent );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	// Check if the inner blocks are selected.
	const hasSelectedInnerBlock = useSelect(
		( select ) =>
			select( blockEditorStore ).hasSelectedInnerBlock( clientId, true ),
		[ clientId ]
	);

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
					onKeyDown={ withIgnoreIMEEvents( handleSummaryKeyDown ) }
					onKeyUp={ handleSummaryKeyUp }
				>
					<RichText
						ref={ summaryRef }
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
						onRemove={ onRemove }
					/>
				</summary>
				{ innerBlocksProps.children }
			</details>
		</>
	);
}

export default DetailsEdit;
