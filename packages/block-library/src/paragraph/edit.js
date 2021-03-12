/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, _x, isRTL } from '@wordpress/i18n';
import { PanelBody, ToggleControl, ToolbarGroup } from '@wordpress/components';
import {
	AlignmentToolbar,
	BlockControls,
	InspectorControls,
	RichText,
	useBlockProps,
	__experimentalUseEditorFeature as useEditorFeature,
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { formatLtr } from '@wordpress/icons';

const name = 'core/paragraph';

function ParagraphRTLToolbar( { direction, setDirection } ) {
	return (
		isRTL() && (
			<ToolbarGroup
				controls={ [
					{
						icon: formatLtr,
						title: _x( 'Left to right', 'editor button' ),
						isActive: direction === 'ltr',
						onClick() {
							setDirection(
								direction === 'ltr' ? undefined : 'ltr'
							);
						},
					},
				] }
			/>
		)
	);
}

function ParagraphBlock( {
	attributes,
	mergeBlocks,
	onReplace,
	onRemove,
	setAttributes,
	clientId,
} ) {
	const { align, content, direction, dropCap, placeholder } = attributes;
	const isDropCapFeatureEnabled = useEditorFeature( 'typography.dropCap' );
	const blockProps = useBlockProps( {
		className: classnames( {
			'has-drop-cap': dropCap,
			[ `has-text-align-${ align }` ]: align,
		} ),
		style: { direction },
	} );

	return (
		<>
			<BlockControls>
				<AlignmentToolbar
					value={ align }
					onChange={ ( newAlign ) =>
						setAttributes( { align: newAlign } )
					}
				/>
				<ParagraphRTLToolbar
					direction={ direction }
					setDirection={ ( newDirection ) =>
						setAttributes( { direction: newDirection } )
					}
				/>
			</BlockControls>
			{ isDropCapFeatureEnabled && (
				<InspectorControls>
					<PanelBody title={ __( 'Text settings' ) }>
						<ToggleControl
							label={ __( 'Drop cap' ) }
							checked={ !! dropCap }
							onChange={ () =>
								setAttributes( { dropCap: ! dropCap } )
							}
							help={
								dropCap
									? __( 'Showing large initial letter.' )
									: __(
											'Toggle to show a large initial letter.'
									  )
							}
						/>
					</PanelBody>
				</InspectorControls>
			) }
			<RichText
				identifier="content"
				tagName="p"
				{ ...blockProps }
				value={ content }
				onChange={ ( newContent ) =>
					setAttributes( { content: newContent } )
				}
				onSplit={ ( value, isOriginal ) => {
					let newAttributes;

					if ( isOriginal || value ) {
						newAttributes = {
							...attributes,
							content: value,
						};
					}

					const block = createBlock( name, newAttributes );

					if ( isOriginal ) {
						block.clientId = clientId;
					}

					return block;
				} }
				onMerge={ mergeBlocks }
				onReplace={ onReplace }
				onRemove={ onRemove }
				aria-label={
					content
						? __( 'Paragraph block' )
						: __(
								'Empty block; start writing or type forward slash to choose a block'
						  )
				}
				data-empty={ content ? false : true }
				placeholder={
					placeholder ||
					__( 'Start writing or type / to choose a block' )
				}
				__unstableEmbedURLOnPaste
				__unstableAllowPrefixTransformations
			/>
		</>
	);
}

export default ParagraphBlock;
