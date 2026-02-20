/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useRef, useMemo, useEffect } from '@wordpress/element';
import {
	BlockControls,
	InspectorControls,
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
	BlockContextProvider,
} from '@wordpress/block-editor';
import {
	ToolbarButton,
	ToolbarGroup,
	PanelBody,
	TextControl,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
const TEMPLATE = [
	[
		'core/dialog-trigger',
		{
			lock: {
				move: true,
				remove: false,
			},
		},
		[
			[
				'core/paragraph',
				{
					placeholder: __(
						'Start typing to add dialog trigger text…'
					),
				},
			],
		],
	],
	[
		'core/dialog-element',
		{
			lock: {
				move: true,
				remove: true,
			},
		},
		[],
	],
];

export default function Edit( { attributes, setAttributes, clientId } ) {
	const { editorIsDialogOpen = false, dialogLabel = '' } = attributes;

	// Get the dialog-element block from inner blocks and check if it's selected.
	const { dialogElementClientId, isDialogElementSelected } = useSelect(
		( select ) => {
			const { getBlock, isBlockSelected, hasSelectedInnerBlock } =
				select( blockEditorStore );
			const block = getBlock( clientId );
			const dialogElementBlock = block?.innerBlocks?.find(
				( innerBlock ) => innerBlock.name === 'core/dialog-element'
			);
			const dialogElementId = dialogElementBlock?.clientId;

			// Check if dialog-element or any of its descendants are selected
			const isSelected = dialogElementId
				? isBlockSelected( dialogElementId ) ||
				  hasSelectedInnerBlock( dialogElementId, true )
				: false;

			return {
				dialogElementClientId: dialogElementId,
				isDialogElementSelected: isSelected,
			};
		},
		[ clientId ]
	);

	const dialogId = useMemo( () => {
		return `block-${ dialogElementClientId }`;
	}, [ dialogElementClientId ] );

	// Get block editor dispatch for non-persistent updates
	const { __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	// Auto-open dialog when dialog-element or its children are selected
	useEffect( () => {
		if ( isDialogElementSelected && ! editorIsDialogOpen ) {
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( { editorIsDialogOpen: true } );
		}
	}, [
		isDialogElementSelected,
		editorIsDialogOpen,
		setAttributes,
		__unstableMarkNextChangeAsNotPersistent,
	] );

	// Set up a ref for the block container
	const ref = useRef( null );

	const blockProps = useBlockProps( {
		ref,
	} );

	// We're locking down the template and allowed blocks to only allow the dialog trigger and dialog element.
	const innerBlocksProps = useInnerBlocksProps(
		{},
		{
			template: TEMPLATE,
			templateLock: 'insert',
		}
	);

	const buttonLabel = useMemo(
		() =>
			editorIsDialogOpen ? __( 'Close dialog' ) : __( 'Edit dialog' ),
		[ editorIsDialogOpen ]
	);

	const toggleDialog = () => {
		__unstableMarkNextChangeAsNotPersistent();
		setAttributes( {
			editorIsDialogOpen: ! editorIsDialogOpen,
		} );
	};

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings' ) }>
					<TextControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'Accessible label' ) }
						help={ __(
							'Describes the dialog for screen readers. Used as the accessible name when no heading is present.'
						) }
						value={ dialogLabel }
						onChange={ ( value ) =>
							setAttributes( { dialogLabel: value } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<BlockControls __experimentalShareWithChildBlocks>
				<ToolbarGroup>
					<ToolbarButton
						label={ buttonLabel }
						onClick={ () => {
							if ( ! dialogElementClientId ) {
								return;
							}
							toggleDialog();
						} }
					>
						{ buttonLabel }
					</ToolbarButton>
				</ToolbarGroup>
			</BlockControls>
			<div { ...blockProps }>
				<BlockContextProvider
					value={ {
						'core/dialog-id': dialogId || null,
						'core/dialog-isDialogOpen': editorIsDialogOpen,
						'core/dialog-label': dialogLabel,
					} }
				>
					{ innerBlocksProps.children }
				</BlockContextProvider>
			</div>
		</>
	);
}
