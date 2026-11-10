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
 * Renders what the slot holds, which is what the template it is in shows when
 * it is rendered on its own.
 *
 * @param props          Component props.
 * @param props.clientId Client ID of the block.
 */
function OwnContent( { clientId }: { clientId: string } ) {
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
				{ __(
					'Templates rendered inside this one go here. Add the blocks to show when it is rendered on its own.'
				) }
			</p>
		),
	} );

	return <div { ...innerBlocksProps } />;
}

type TemplateSlotEditProps = {
	clientId: string;
	context: { templateSlotId?: string };
};

export default function TemplateSlotEdit( {
	clientId,
	context: { templateSlotId },
}: TemplateSlotEditProps ) {
	// The front end renders a template in the first slot only, which is the
	// only one a template can be given; a slot added anyway shows what it
	// holds, as it does there.
	const isFirstSlot = useSelect(
		( select ) =>
			select( blockEditorStore ).getBlocksByName(
				'core/template-slot'
			)[ 0 ] === clientId,
		[ clientId ]
	);

	if ( templateSlotId && isFirstSlot ) {
		return <SlottedTemplate templateId={ templateSlotId } />;
	}

	return <OwnContent clientId={ clientId } />;
}
