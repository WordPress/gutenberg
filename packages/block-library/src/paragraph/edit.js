/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, _x, isRTL } from '@wordpress/i18n';
import {
	ToolbarDropdownMenu,
	PanelBody,
	ToggleControl,
} from '@wordpress/components';
import {
	AlignmentControl,
	BlockControls,
	InspectorControls,
	RichText,
	useBlockProps,
	useSetting,
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { formatLtr } from '@wordpress/icons';
import { useCallback } from '@wordpress/element';

const name = 'core/paragraph';

function ParagraphRTLControl( { direction, setDirection } ) {
	return (
		isRTL() && (
			<ToolbarDropdownMenu
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
	const isDropCapFeatureEnabled = useSetting( 'typography.dropCap' );
	const blockProps = useBlockProps( {
		className: classnames( {
			'has-drop-cap': dropCap,
			[ `has-text-align-${ align }` ]: align,
		} ),
		style: { direction },
	} );

	const updateContent = useCallback(
		( newContent ) => setAttributes( { content: newContent } ),
		[ setAttributes ]
	);

	const splitParagraph = useCallback(
		( value, isOriginal ) => {
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
		},
		[ attributes, createBlock ]
	);

	const updateAlign = useCallback( ( newAlign ) =>
		setAttributes( { align: newAlign }, [ setAttributes ] )
	);

	const setDirection = useCallback(
		( newDirection ) => setAttributes( { direction: newDirection } ),
		[]
	);

	const setDropCap = useCallback(
		() => setAttributes( { dropCap: ! dropCap } ),
		[ setAttributes ]
	);

	return (
		<>
			<BlockControls group="block">
				<AlignmentControl value={ align } onChange={ updateAlign } />
				<ParagraphRTLControl
					direction={ direction }
					setDirection={ setDirection }
				/>
			</BlockControls>
			{ isDropCapFeatureEnabled && (
				<InspectorControls>
					<PanelBody title={ __( 'Text settings' ) }>
						<ToggleControl
							label={ __( 'Drop cap' ) }
							checked={ !! dropCap }
							onChange={ setDropCap }
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
				onChange={ updateContent }
				onSplit={ splitParagraph }
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
				placeholder={ placeholder || __( 'Type / to choose a block' ) }
				__unstableEmbedURLOnPaste
				__unstableAllowPrefixTransformations
			/>
		</>
	);
}

export default ParagraphBlock;
