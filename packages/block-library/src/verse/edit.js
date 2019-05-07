/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	RichText,
	BlockControls,
	AlignmentToolbar,
} from '@wordpress/block-editor';

export default function VerseEdit( { attributes, setAttributes, className, mergeBlocks } ) {
	const { textAlign, content } = attributes;

	return (
		<>
			<BlockControls>
				<AlignmentToolbar
					value={ textAlign }
					onChange={ ( nextAlign ) => {
						setAttributes( { textAlign: nextAlign } );
					} }
				/>
			</BlockControls>
			<RichText
				tagName="pre"
				value={ content }
				onChange={ ( nextContent ) => {
					setAttributes( {
						content: nextContent,
					} );
				} }
				style={ { textAlign } }
				placeholder={ __( 'Write…' ) }
				wrapperClassName={ className }
				onMerge={ mergeBlocks }
			/>
		</>
	);
}
