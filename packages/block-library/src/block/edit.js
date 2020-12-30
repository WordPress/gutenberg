/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	useEntityBlockEditor,
	useEntityProp,
	store as coreStore,
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
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
	InnerBlocks,
	BlockControls,
	InspectorControls,
	useBlockProps,
} from '@wordpress/block-editor';
import { store as reusableBlocksStore } from '@wordpress/reusable-blocks';

/**
 * Internal dependencies
 */

export default function ReusableBlockEdit( { attributes: { ref }, clientId } ) {
	const recordArgs = [ 'postType', 'wp_block', ref ];

	const { reusableBlock, hasResolved } = useSelect(
		( select ) => ( {
			reusableBlock: select( coreStore ).getEditedEntityRecord(
				...recordArgs
			),
			hasResolved: select( coreStore ).hasFinishedResolution(
				'getEditedEntityRecord',
				recordArgs
			),
		} ),
		[ ref, clientId ]
	);

	const {
		__experimentalConvertBlockToStatic: convertBlockToStatic,
	} = useDispatch( reusableBlocksStore );

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

	const innerBlocksProps = useInnerBlocksProps(
		{},
		{
			value: blocks,
			onInput,
			onChange,
			renderAppender: blocks?.length
				? undefined
				: InnerBlocks.ButtonBlockAppender,
		}
	);

	const blockProps = useBlockProps();

	if ( ! hasResolved ) {
		return (
			<div { ...blockProps }>
				<Placeholder>
					<Spinner />
				</Placeholder>
			</div>
		);
	}

	if ( ! reusableBlock ) {
		return (
			<div { ...blockProps }>
				<Placeholder>
					{ __( 'Block has been deleted or is unavailable.' ) }
				</Placeholder>
			</div>
		);
	}

	return (
		<div { ...blockProps }>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						onClick={ () => convertBlockToStatic( clientId ) }
					>
						{ __( 'Convert to regular blocks' ) }
					</ToolbarButton>
				</ToolbarGroup>
			</BlockControls>
			<InspectorControls>
				<PanelBody>
					<TextControl
						label={ __( 'Name' ) }
						value={ title }
						onChange={ setTitle }
					/>
				</PanelBody>
			</InspectorControls>
			<div className="block-library-block__reusable-block-container">
				{ <div { ...innerBlocksProps } /> }
			</div>
		</div>
	);
}
