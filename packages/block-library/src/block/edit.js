/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import {
	useEntityBlockEditor,
	useEntityProp,
	useEntityRecord,
} from '@wordpress/core-data';
import {
	Placeholder,
	Spinner,
	ToolbarGroup,
	ToolbarButton,
	TextControl,
	PanelBody,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	useInnerBlocksProps,
	__experimentalRecursionProvider as RecursionProvider,
	__experimentalUseHasRecursion as useHasRecursion,
	InnerBlocks,
	BlockControls,
	InspectorControls,
	useBlockProps,
	Warning,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { store as reusableBlocksStore } from '@wordpress/reusable-blocks';
import { ungroup } from '@wordpress/icons';

export default function ReusableBlockEdit( { attributes: { ref }, clientId } ) {
	const hasAlreadyRendered = useHasRecursion( ref );
	const { record, hasResolved } = useEntityRecord(
		'postType',
		'wp_block',
		ref
	);
	const isMissing = hasResolved && ! record;

	const { canRemove, innerBlockCount } = useSelect(
		( select ) => {
			const { canRemoveBlock, getBlockCount } =
				select( blockEditorStore );
			return {
				canRemove: canRemoveBlock( clientId ),
				innerBlockCount: getBlockCount( clientId ),
			};
		},
		[ clientId ]
	);

	const { __experimentalConvertBlockToStatic: convertBlockToStatic } =
		useDispatch( reusableBlocksStore );

	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		'wp_block',
		{ id: ref }
	);

	const [ title, setTitle ] = useEntityProp(
		'postType',
		'wp_block',
		'title',
		ref
	);

	const blockProps = useBlockProps( {
		className: 'block-library-block__reusable-block-container',
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		value: blocks,
		onInput,
		onChange,
		renderAppender: blocks?.length
			? undefined
			: InnerBlocks.ButtonBlockAppender,
	} );

	if ( hasAlreadyRendered ) {
		return (
			<div { ...blockProps }>
				<Warning>
					{ __( 'Block cannot be rendered inside itself.' ) }
				</Warning>
			</div>
		);
	}

	if ( isMissing ) {
		return (
			<div { ...blockProps }>
				<Warning>
					{ __( 'Block has been deleted or is unavailable.' ) }
				</Warning>
			</div>
		);
	}

	if ( ! hasResolved ) {
		return (
			<div { ...blockProps }>
				<Placeholder>
					<Spinner />
				</Placeholder>
			</div>
		);
	}

	return (
		<RecursionProvider uniqueId={ ref }>
			{ canRemove && (
				<BlockControls>
					<ToolbarGroup>
						<ToolbarButton
							onClick={ () => convertBlockToStatic( clientId ) }
							label={
								innerBlockCount > 1
									? __( 'Convert to regular blocks' )
									: __( 'Convert to regular block' )
							}
							icon={ ungroup }
							showTooltip
						/>
					</ToolbarGroup>
				</BlockControls>
			) }
			<InspectorControls>
				<PanelBody>
					<TextControl
						__nextHasNoMarginBottom
						label={ __( 'Name' ) }
						value={ title }
						onChange={ setTitle }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...innerBlocksProps } />
		</RecursionProvider>
	);
}
