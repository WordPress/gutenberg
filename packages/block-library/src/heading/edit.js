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
import { useEffect } from '@wordpress/element';

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
	const { textAlign, content, level, placeholder } = attributes;
	const tagName = 'h' + level;
	const blockProps = useBlockProps( {
		className: classnames( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
		style: mergedStyle,
	} );
	const generatedAnchor = useGeneratedAnchor(
		clientId,
		attributes.anchor,
		content
	);

	// Update anchor when the content changes.
	useEffect( () => {
		if ( generatedAnchor && generatedAnchor.startsWith( 'wp-' ) ) {
			setAttributes( { anchor: generatedAnchor } );
		}
	}, [ generatedAnchor ] );

	// Make sure manually-edited anchors don't have the `wp-` prefix.
	// `wp-` marks an anchor as auto-generated.
	useEffect( () => {
		if (
			attributes.anchor &&
			generatedAnchor !== attributes.anchor &&
			attributes.anchor.startsWith( 'wp-' )
		) {
			setAttributes( {
				anchor: attributes.anchor.replace( 'wp-', '' ),
			} );
		}
	}, [ attributes.anchor ] );

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
