/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, Platform } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { createBlock, getDefaultBlockName } from '@wordpress/blocks';
import {
	AlignmentControl,
	BlockControls,
	RichText,
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import HeadingLevelDropdown from './heading-level-dropdown';
import { generateAnchor, setAnchor } from './autogenerate-anchors';

function HeadingEdit( {
	attributes,
	setAttributes,
	mergeBlocks,
	onReplace,
	style,
	clientId,
} ) {
	const { textAlign, content, level, placeholder, anchor } = attributes;
	const tagName = 'h' + level;
	const blockProps = useBlockProps( {
		className: classnames( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
		style,
	} );

	const { canGenerateAnchors } = useSelect( ( select ) => {
		const settings = select( blockEditorStore ).getSettings();

		return {
			canGenerateAnchors: !! settings.__experimentalGenerateAnchors,
		};
	}, [] );

	const { __unstableMarkNextChangeAsNotPersistent } = useDispatch(
		blockEditorStore
	);

	// Initially set anchor for headings that have content but no anchor set.
	// This is used when transforming a block to heading, or for legacy anchors.
	useEffect( () => {
		if ( ! canGenerateAnchors ) {
			return;
		}

		if ( ! anchor && content ) {
			// This side-effect should not create an undo level.
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( {
				anchor: generateAnchor( clientId, content ),
			} );
		}
		setAnchor( clientId, anchor );

		// Remove anchor map when block unmounts.
		return () => setAnchor( clientId, null );
	}, [ content, anchor ] );

	const onContentChange = ( value ) => {
		const newAttrs = { content: value };
		if (
			canGenerateAnchors &&
			( ! anchor ||
				! value ||
				generateAnchor( clientId, content ) === anchor )
		) {
			newAttrs.anchor = generateAnchor( clientId, value );
		}
		setAttributes( newAttrs );
	};

	return (
		<>
			<BlockControls group="block">
				<HeadingLevelDropdown
					selectedLevel={ level }
					onChange={ ( newLevel ) =>
						setAttributes( { level: newLevel } )
					}
				/>
				<AlignmentControl
					value={ textAlign }
					onChange={ ( nextAlign ) => {
						setAttributes( { textAlign: nextAlign } );
					} }
				/>
			</BlockControls>
			<RichText
				identifier="content"
				tagName={ tagName }
				value={ content }
				onChange={ onContentChange }
				onMerge={ mergeBlocks }
				onSplit={ ( value, isOriginal ) => {
					let block;

					if ( isOriginal || value ) {
						block = createBlock( 'core/heading', {
							...attributes,
							content: value,
						} );
					} else {
						block = createBlock(
							getDefaultBlockName() ?? 'core/heading'
						);
					}

					if ( isOriginal ) {
						block.clientId = clientId;
					}

					return block;
				} }
				onReplace={ onReplace }
				onRemove={ () => onReplace( [] ) }
				aria-label={ __( 'Heading text' ) }
				placeholder={ placeholder || __( 'Heading' ) }
				textAlign={ textAlign }
				{ ...( Platform.isNative && { deleteEnter: true } ) } // setup RichText on native mobile to delete the "Enter" key as it's handled by the JS/RN side
				{ ...blockProps }
			/>
		</>
	);
}

export default HeadingEdit;
