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
	AlignmentToolbar,
	BlockControls,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import { ToolbarGroup } from '@wordpress/components';

import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import HeadingLevelDropdown from './heading-level-dropdown';

function HeadingEdit( {
	attributes,
	setAttributes,
	mergeBlocks,
	onReplace,
	mergedStyle,
	clientId,
} ) {
	const { textAlign, content, level, placeholder } = attributes;
	const block = useSelect(
		( select ) => select( 'core/block-editor' ).getBlock( clientId ),
		[]
	);

	const tagName = 'h' + level;
	const blockProps = useBlockProps( {
		className: classnames( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
		style: mergedStyle,
	} );

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<HeadingLevelDropdown
						selectedLevel={ level }
						onChange={ ( newLevel ) =>
							setAttributes( { level: newLevel } )
						}
					/>
				</ToolbarGroup>
				<AlignmentToolbar
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
				onSplit={ ( value, keepId ) => {
					if ( keepId ) {
						return {
							...block,
							attributes: {
								...block.attributes,
								content: value || '',
							},
						};
					}

					if ( ! value ) {
						return createBlock( 'core/paragraph' );
					}

					return createBlock( 'core/heading', {
						...attributes,
						content: value,
					} );
				} }
				onReplace={ onReplace }
				onRemove={ () => onReplace( [] ) }
				aria-label={ __( 'Heading text' ) }
				placeholder={ placeholder || __( 'Write heading…' ) }
				textAlign={ textAlign }
				{ ...blockProps }
			/>
		</>
	);
}

export default HeadingEdit;
