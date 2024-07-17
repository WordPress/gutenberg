/**
 * WordPress dependencies
 */
import { InnerBlocks, RichText, useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

export default function Edit( { attributes, setAttributes } ) {
	const { title } = attributes;

	return (
		<div { ...useBlockProps() }>
			<RichText
				className="wp-block-tab__title"
				tagName="div"
				value={ title }
				onChange={ ( newTitle ) =>
					setAttributes( { title: newTitle } )
				}
				placeholder={ __( 'Add text…' ) }
			/>
			<div className="wp-block-tab__content">
				<InnerBlocks />
			</div>
		</div>
	);
}
