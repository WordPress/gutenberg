import { __ } from '@wordpress/i18n';
import {
	BlockContextProvider,
	InnerBlocks,
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { useEntityBlockEditor, store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

/**
 * The context of the blocks of a template rendered in the slot.
 *
 * The editor names the template to render in the slot through
 * `templateSlotId`. The blocks of that template stand for the post it renders,
 * like the rest of the canvas, so they only need the name taken away: a slot
 * among them is that template's own, and holds what it shows on its own.
 */
const SLOTTED_TEMPLATE_CONTEXT = { templateSlotId: undefined };

type BlockList = ReturnType< typeof useEntityBlockEditor >[ 0 ];
type BlockListChange = ReturnType< typeof useEntityBlockEditor >[ 1 ];

type SlottedTemplateLoadedProps = {
	blockProps: ReturnType< typeof useBlockProps >;
	blocks: BlockList;
	onInput: BlockListChange;
	onChange: BlockListChange;
};

function SlottedTemplateLoaded( {
	blockProps,
	blocks,
	onInput,
	onChange,
}: SlottedTemplateLoadedProps ) {
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		value: blocks,
		onInput,
		onChange,
	} );

	return (
		<BlockContextProvider value={ SLOTTED_TEMPLATE_CONTEXT }>
			<div { ...innerBlocksProps } />
		</BlockContextProvider>
	);
}

/**
 * Renders the blocks of the template rendered inside this one, editable, in
 * place of what the slot holds.
 *
 * @param props            Component props.
 * @param props.templateId ID of the template rendered in the slot.
 */
function SlottedTemplate( { templateId }: { templateId: string } ) {
	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		'wp_template',
		{ id: templateId }
	);

	// Wait for the template before mounting the inner blocks area, so that an
	// empty `blocks` value means an empty template rather than one that has
	// not loaded yet.
	const hasLoadedTemplate = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecord(
				'postType',
				'wp_template',
				templateId
			) !== undefined ||
			select( coreStore ).hasFinishedResolution( 'getEntityRecord', [
				'postType',
				'wp_template',
				templateId,
			] ),
		[ templateId ]
	);

	const blockProps = useBlockProps();

	if ( ! hasLoadedTemplate ) {
		return <div { ...blockProps } />;
	}

	return (
		<SlottedTemplateLoaded
			blockProps={ blockProps }
			blocks={ blocks }
			onInput={ onInput }
			onChange={ onChange }
		/>
	);
}

/**
 * Renders what the slot holds.
 *
 * For the slot of a template that is what the template shows when it is
 * rendered on its own. A template renders the templates inside it in its first
 * slot only, so any other slot it holds shows its blocks whatever is rendered.
 *
 * @param props                  Component props.
 * @param props.clientId         Client ID of the block.
 * @param props.isSlotOfTemplate Whether the block is the slot of the template it is in, which is its first.
 */
function OwnContent( {
	clientId,
	isSlotOfTemplate,
}: {
	clientId: string;
	isSlotOfTemplate: boolean;
} ) {
	const hasInnerBlocks = useSelect(
		( select ) => select( blockEditorStore ).getBlockCount( clientId ) > 0,
		[ clientId ]
	);
	const innerBlocksProps = useInnerBlocksProps( useBlockProps(), {
		renderAppender: hasInnerBlocks
			? undefined
			: InnerBlocks.ButtonBlockAppender,
		placeholder: (
			<p className="wp-block-template-slot__placeholder">
				{ isSlotOfTemplate
					? __(
							'Templates rendered inside this one go here. Add the blocks to show when it is rendered on its own.'
						)
					: __(
							'Only the first Template Slot of a template holds the templates rendered inside it. Add the blocks to show here.'
						) }
			</p>
		),
	} );

	return <div { ...innerBlocksProps } />;
}

/**
 * Tells where a slot stands among the slots on the canvas.
 *
 * A template renders the templates inside it in its first slot, here and on
 * the front end, which looks for it among the blocks of that template alone:
 * not among the ones of its template parts, nor among the ones of a template
 * rendered in the slot, whose slots are that template's own.
 *
 * Whatever a block renders on the canvas that way is its controlled inner
 * blocks. So two slots belong to the same template when the nearest block
 * above each with controlled inner blocks is the same, and to the template at
 * the root of the canvas when there is none.
 *
 * @param clientId Client ID of the slot.
 * @return Whether the slot is the first of the template it is in, and whether that template is the one at the root of the canvas.
 */
function useSlotPosition( clientId: string ) {
	return useSelect(
		( select ) => {
			const {
				getBlocksByName,
				getBlockParents,
				areInnerBlocksControlled,
			} = select( blockEditorStore );
			const getController = ( slotClientId: string ) =>
				getBlockParents( slotClientId, true ).find(
					( parentClientId ) =>
						areInnerBlocksControlled( parentClientId )
				);
			const controller = getController( clientId );

			return {
				isFirstOfTemplate:
					getBlocksByName( 'core/template-slot' ).find(
						( slotClientId ) =>
							getController( slotClientId ) === controller
					) === clientId,
				isInRootTemplate: controller === undefined,
			};
		},
		[ clientId ]
	);
}

type TemplateSlotEditProps = {
	clientId: string;
	context: { templateSlotId?: string };
};

export default function TemplateSlotEdit( {
	clientId,
	context: { templateSlotId },
}: TemplateSlotEditProps ) {
	const { isFirstOfTemplate, isInRootTemplate } = useSlotPosition( clientId );

	// The editor names the template to render for the template at the root
	// of the canvas, which renders it in its slot.
	if ( templateSlotId && isInRootTemplate && isFirstOfTemplate ) {
		return <SlottedTemplate templateId={ templateSlotId } />;
	}

	return (
		<OwnContent
			clientId={ clientId }
			isSlotOfTemplate={ isFirstOfTemplate }
		/>
	);
}
