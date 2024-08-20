/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, Platform } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	AlignmentControl,
	BlockControls,
	RichText,
	useBlockProps,
	store as blockEditorStore,
	HeadingLevelDropdown,
	useBlockEditingMode,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { generateAnchor, setAnchor } from './autogenerate-anchors';

function HeadingEdit( {
	attributes,
	setAttributes,
	mergeBlocks,
	onReplace,
	style,
	clientId,
} ) {
	const { textAlign, content, level, levelOptions, placeholder, anchor } =
		attributes;
	const tagName = 'h' + level;
	const blockProps = useBlockProps( {
		className: clsx( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
		style,
	} );
	const blockEditingMode = useBlockEditingMode();

	const { canGenerateAnchors } = useSelect( ( select ) => {
		const { getGlobalBlockCount, getSettings } = select( blockEditorStore );
		const settings = getSettings();

		return {
			canGenerateAnchors:
				!! settings.generateAnchors ||
				getGlobalBlockCount( 'core/table-of-contents' ) > 0,
		};
	}, [] );

	const { __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

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
	}, [ anchor, content, clientId, canGenerateAnchors ] );

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
			{ blockEditingMode === 'default' && (
				<BlockControls group="block">
					<HeadingLevelDropdown
						value={ level }
						options={ levelOptions }
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
			) }
			<RichText
				identifier="content"
				tagName={ tagName }
				value={ content }
				onChange={ onContentChange }
				onMerge={ mergeBlocks }
				onReplace={ onReplace }
				onRemove={ () => onReplace( [] ) }
				placeholder={ placeholder || __( 'Heading' ) }
				textAlign={ textAlign }
				{ ...( Platform.isNative && { deleteEnter: true } ) } // setup RichText on native mobile to delete the "Enter" key as it's handled by the JS/RN side
				{ ...blockProps }
			/>
		</>
	);
}

export default HeadingEdit;
