/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

export default function Edit( {
	attributes,
	setAttributes,
	className,
	onReplace,
	mergeBlocks,
} ) {
	return (
		<li className={ className }>
			<input
				type="checkbox"
				className={ className + '__checked' }
				checked={ attributes.checked }
				onChange={ ( { target: { checked } } ) =>
					setAttributes( { checked } )
				}
			/>
			<RichText
				tagName="span"
				placeholder={ __( 'Checklist item' ) }
				keepPlaceholderOnFocus
				identifier="value"
				className={ className + '__value' }
				value={ attributes.value }
				onChange={ ( value ) => setAttributes( { value } ) }
				onReplace={ onReplace }
				onSplit={ ( value ) => {
					if ( ! value ) {
						return createBlock( 'core/checklist-item' );
					}

					return createBlock( 'core/checklist-item', {
						...attributes,
						value,
					} );
				} }
				onMerge={ mergeBlocks }
			/>
		</li>
	);
}
