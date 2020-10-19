/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { PanelBody, ToggleControl, ToolbarGroup } from '@wordpress/components';
import {
	AlignmentToolbar,
	BlockControls,
	InspectorControls,
	RichText,
	useBlockProps,
	getFontSize,
	__experimentalUseEditorFeature as useEditorFeature,
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { useEffect, useRef, useState } from '@wordpress/element';
import { formatLtr } from '@wordpress/icons';

function getComputedStyle( node, pseudo ) {
	return node.ownerDocument.defaultView.getComputedStyle( node, pseudo );
}

const name = 'core/paragraph';

function ParagraphRTLToolbar( { direction, setDirection } ) {
	const isRTL = useSelect( ( select ) => {
		return !! select( 'core/block-editor' ).getSettings().isRTL;
	}, [] );

	return (
		isRTL && (
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

function useDropCapMinHeight( ref, isDisabled, dependencies ) {
	const [ minHeight, setMinHeight ] = useState();

	useEffect( () => {
		if ( isDisabled ) {
			setMinHeight();
			return;
		}

		setMinHeight(
			getComputedStyle( ref.current, 'first-letter' ).lineHeight
		);
	}, [ isDisabled, ...dependencies ] );

	return minHeight;
}

function ParagraphBlock( {
	attributes,
	mergeBlocks,
	onReplace,
	onRemove,
	setAttributes,
} ) {
	const {
		align,
		content,
		direction,
		dropCap,
		placeholder,
		fontSize,
		style,
	} = attributes;
	const isDropCapFeatureEnabled = useEditorFeature( 'typography.dropCap' );
	const ref = useRef();
	const inlineFontSize = style?.fontSize;
	const size = useSelect(
		( select ) => {
			const { fontSizes } = select( 'core/block-editor' ).getSettings();
			return getFontSize( fontSizes, fontSize, inlineFontSize ).size;
		},
		[ fontSize, inlineFontSize ]
	);
	const hasDropCap = isDropCapFeatureEnabled && dropCap;
	const minHeight = useDropCapMinHeight( ref, ! hasDropCap, [ size ] );
	const blockProps = useBlockProps( {
		ref,
		className: classnames( {
			'has-drop-cap': dropCap,
			[ `has-text-align-${ align }` ]: align,
		} ),
		style: { direction, minHeight },
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
				onSplit={ ( value ) => {
					if ( ! value ) {
						return createBlock( name );
					}

					return createBlock( name, {
						...attributes,
						content: value,
					} );
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
