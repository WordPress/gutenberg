/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useRef, useMemo } from '@wordpress/element';
import {
	BlockControls,
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
	store as blockEditorStore,
	BlockContextProvider,
} from '@wordpress/block-editor';
import {
	Button,
	ToolbarButton,
	ToolbarGroup,
	PanelBody,
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
						'Start typing to add Dialog trigger text…'
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
		[
			[
				'core/heading',
				{
					level: 2,
					placeholder: __( 'Add a dialog label…' ),
					metadata: {
						bindings: {
							content: {
								source: 'core/dialog-element-label',
							},
						},
					},
				},
			],
		],
	],
];

export default function Edit( { attributes, setAttributes, clientId } ) {
	const { editorIsDialogOpen = false } = attributes;

	// Get the dialog-element block from inner blocks.
	const { dialogElementClientId } = useSelect(
		( select ) => {
			const { getBlock } = select( blockEditorStore );
			const block = getBlock( clientId );
			const dialogElementBlock = block?.innerBlocks?.find(
				( innerBlock ) => innerBlock.name === 'core/dialog-element'
			);
			const dialogElementId = dialogElementBlock?.clientId;

			return {
				dialogElementClientId: dialogElementId,
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
			editorIsDialogOpen ? __( 'Close Dialog' ) : __( 'Edit Dialog' ),
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
			<InspectorControls>
				<PanelBody title={ __( 'Dialog Settings' ) }>
					<div>
						<p>
							{ __(
								'The dialog element requires a dialog trigger and a dialog element. You can edit the text of the trigger and the content of the dialog by clicking the "Edit Dialog" button above.'
							) }
						</p>
						<Button
							__next40pxDefaultSize
							variant="tertiary"
							onClick={ toggleDialog }
							disabled={ ! dialogElementClientId }
							accessibleWhenDisabled
						>
							{ editorIsDialogOpen
								? __( 'Close Dialog' )
								: __( 'Edit Dialog' ) }
						</Button>
					</div>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<BlockContextProvider
					value={ {
						'core/dialog-id': dialogId || null,
						'core/dialog-isDialogOpen': editorIsDialogOpen,
					} }
				>
					{ innerBlocksProps.children }
				</BlockContextProvider>
			</div>
		</>
	);
}
