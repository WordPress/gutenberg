/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';
import {
	AlignmentControl,
	BlockControls,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import { useEffect, useState } from '@wordpress/element';
import { usePrevious } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import HeadingLevelDropdown from './heading-level-dropdown';
import useGeneratedAnchor from './autogenerate-anchors';

function HeadingEdit( {
	attributes,
	setAttributes,
	mergeBlocks,
	onReplace,
	mergedStyle,
	clientId,
} ) {
	const { textAlign, content, level, placeholder, anchor } = attributes;
	const tagName = 'h' + level;
	const blockProps = useBlockProps( {
		className: classnames( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
		style: mergedStyle,
	} );
	const updateAnchor = ( newAnchor ) =>
		setAttributes( { anchor: newAnchor } );

	const generatedAnchor = useGeneratedAnchor(
		clientId,
		attributes.anchor,
		content
	);
	const [ autoGen, setAutoGen ] = useState(
		! anchor || generatedAnchor === anchor
	);
	const prevAnchor = usePrevious( anchor );

	useEffect( () => {
		// Here the anchor has been changed from the sidebar input.
		setAutoGen( anchor === prevAnchor );
	}, [ anchor, prevAnchor ] );

	useEffect( () => {
		// No generated so do nothing.
		if ( ! generatedAnchor ) return;
		if ( autoGen && anchor !== generatedAnchor ) {
			updateAnchor( generatedAnchor );
		}
	}, [ autoGen, anchor, generatedAnchor ] );

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
				onChange={ ( value ) => setAttributes( { content: value } ) }
				onMerge={ mergeBlocks }
				onSplit={ ( value, isOriginal ) => {
					let block;

					if ( isOriginal || value ) {
						block = createBlock( 'core/heading', {
							...attributes,
							content: value,
						} );
					} else {
						block = createBlock( 'core/paragraph' );
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
				{ ...blockProps }
			/>
		</>
	);
}

export default HeadingEdit;
