/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	useInnerBlocksProps,
	RichText,
	BlockIcon,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

export default function DetailsEdit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps( { className: 'is-disabled' } );
	const innerBlocksProps = useInnerBlocksProps( { className: 'wp-block-details__inner-container' } )
	return (
		<details { ...blockProps } open>
			<summary onClick={ ( event ) => event.preventDefault() }>
				<RichText
					identifier="content"
					tagName="span"
					className="wp-block-details__summary-text"
					value={ attributes.summary }
					onChange={ ( value ) => setAttributes( { summary: value } ) }
					placeholder={ __( 'Click the arrow to expand' ) }
					deleteEnter={ false }
					inlineToolbar
				/>
			</summary>
			<div { ...innerBlocksProps } />
		</details>
	);
}
