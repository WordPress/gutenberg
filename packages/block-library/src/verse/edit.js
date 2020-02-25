/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	RichText,
	BlockControls,
	AlignmentToolbar,
} from '@wordpress/block-editor';
import { Platform } from '@wordpress/element';

export default function VerseEdit( {
	attributes,
	setAttributes,
	className,
	mergeBlocks,
} ) {
	const { textAlign, content } = attributes;
	const isAlignmentToolbarCollapsed = Platform.select( {
		web: true,
		native: false,
	} );

	return (
		<>
			<BlockControls>
				<AlignmentToolbar
					isCollapsed={ isAlignmentToolbarCollapsed }
					value={ textAlign }
					onChange={ ( nextAlign ) => {
						setAttributes( { textAlign: nextAlign } );
					} }
				/>
			</BlockControls>
			<RichText
				tagName="pre"
				preserveWhiteSpace
				value={ content }
				onChange={ ( nextContent ) => {
					setAttributes( {
						content: nextContent,
					} );
				} }
				placeholder={ __( 'Write…' ) }
				className={ classnames( className, {
					[ `has-text-align-${ textAlign }` ]: textAlign,
				} ) }
				onMerge={ mergeBlocks }
				textAlign={ textAlign }
			/>
		</>
	);
}
