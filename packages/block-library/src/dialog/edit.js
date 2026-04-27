/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useRef, useMemo, useEffect } from '@wordpress/element';
import {
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
	BlockContextProvider,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { InspectorPanel, Toolbar } from './controls';
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
				'core/buttons',
				{},
				[
					[
						'core/button',
						{
							text: __( 'Open dialog' ),
							tagName: 'button',
						},
					],
				],
			],
		],
	],
	[
		'core/dialog-content',
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
	const {
		editorIsDialogOpen = false,
		editorIsDialogLocked = false,
		dialogLabel = '',
	} = attributes;

	// Get the dialog-content block from inner blocks and check if it's selected.
	const { dialogElementClientId, isDialogElementSelected } = useSelect(
		( select ) => {
			const { getBlock, isBlockSelected, hasSelectedInnerBlock } =
				select( blockEditorStore );
			const block = getBlock( clientId );
			const dialogElementBlock = block?.innerBlocks?.find(
				( innerBlock ) => innerBlock.name === 'core/dialog-content'
			);
			const dialogElementId = dialogElementBlock?.clientId;
			// Check if dialog-content or any of its descendants are selected
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

	// Auto open dialog when dialog-content or its children are selected
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

	const blockProps = useBlockProps( { ref } );

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
			// Reset lock whenever the toolbar explicitly closes the dialog.
			...( editorIsDialogOpen && { editorIsDialogLocked: false } ),
		} );
	};

	const toggleLock = () => {
		__unstableMarkNextChangeAsNotPersistent();
		setAttributes( { editorIsDialogLocked: ! editorIsDialogLocked } );
	};

	return (
		<>
			<InspectorPanel
				dialogLabel={ dialogLabel }
				setAttributes={ setAttributes }
			/>
			<Toolbar
				buttonLabel={ buttonLabel }
				dialogElementClientId={ dialogElementClientId }
				toggleDialog={ toggleDialog }
				editorIsDialogOpen={ editorIsDialogOpen }
				editorIsDialogLocked={ editorIsDialogLocked }
				toggleLock={ toggleLock }
			/>
			<div { ...blockProps }>
				<BlockContextProvider
					value={ {
						'core/dialog-id': dialogId || null,
						'core/dialog-isDialogOpen': editorIsDialogOpen,
						'core/dialog-isDialogLocked': editorIsDialogLocked,
						'core/dialog-label': dialogLabel,
					} }
				>
					{ innerBlocksProps.children }
				</BlockContextProvider>
			</div>
		</>
	);
}
