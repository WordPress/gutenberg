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
	__experimentalUseBlockWrapperProps as useBlockWrapperProps,
} from '@wordpress/block-editor';
import { ToolbarGroup } from '@wordpress/components';

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
} ) {
	const { align, content, level, placeholder } = attributes;
	const tagName = 'h' + level;
	const blockWrapperProps = useBlockWrapperProps( {
		className: classnames( {
			[ `has-text-align-${ align }` ]: align,
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
					value={ align }
					onChange={ ( nextAlign ) => {
						setAttributes( { align: nextAlign } );
					} }
				/>
			</BlockControls>
			<RichText
				identifier="content"
				tagName={ tagName }
				value={ content }
				onChange={ ( value ) => setAttributes( { content: value } ) }
				onMerge={ mergeBlocks }
				onSplit={ ( value ) => {
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
				placeholder={ placeholder || __( 'Write heading…' ) }
				textAlign={ align }
				{ ...blockWrapperProps }
			/>
		</>
	);
}

export default HeadingEdit;
