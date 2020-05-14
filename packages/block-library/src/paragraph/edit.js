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
	__experimentalBlock as Block,
	getFontSize,
	__experimentalUseEditorFeature as useEditorFeature,
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { useEffect, useState, useRef } from '@wordpress/element';
import { formatLtr } from '@wordpress/icons';

/**
 * Browser dependencies
 */
const { getComputedStyle } = window;
const querySelector = window.document.querySelector.bind( document );

const name = 'core/paragraph';
const PARAGRAPH_DROP_CAP_SELECTOR = 'p.has-drop-cap';

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

function useDropCap( isDropCap, fontSize, styleFontSize ) {
	const isDisabled = useEditorFeature( '__experimentalDisableDropCap' );

	const [ minimumHeight, setMinimumHeight ] = useState();

	const { fontSizes } = useSelect( ( select ) =>
		select( 'core/block-editor' ).getSettings()
	);

	const fontSizeObject = getFontSize( fontSizes, fontSize, styleFontSize );
	useEffect( () => {
		if ( isDisabled ) {
			return;
		}

		const element = querySelector( PARAGRAPH_DROP_CAP_SELECTOR );
		if ( isDropCap && element ) {
			setMinimumHeight(
				getComputedStyle( element, 'first-letter' ).lineHeight
			);
		} else if ( minimumHeight ) {
			setMinimumHeight( undefined );
		}
	}, [
		isDisabled,
		isDropCap,
		minimumHeight,
		setMinimumHeight,
		fontSizeObject.size,
	] );

	return [ ! isDisabled, minimumHeight ];
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
	const ref = useRef();
	const [ isDropCapEnabled, dropCapMinimumHeight ] = useDropCap(
		dropCap,
		fontSize,
		style?.fontSize
	);

	const styles = {
		direction,
		minHeight: dropCapMinimumHeight,
	};

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
			<InspectorControls>
				{ isDropCapEnabled && (
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
				) }
			</InspectorControls>
			<RichText
				ref={ ref }
				identifier="content"
				tagName={ Block.p }
				className={ classnames( {
					'has-drop-cap': dropCap,
					[ `has-text-align-${ align }` ]: align,
				} ) }
				style={ styles }
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
