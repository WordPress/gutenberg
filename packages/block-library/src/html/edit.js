/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useContext } from '@wordpress/element';
import { PlainText, useBlockProps } from '@wordpress/block-editor';
import { Disabled } from '@wordpress/components';

/**
 * Internal dependencies
 */
import Preview from './preview';

export default function HTMLEdit( { attributes, setAttributes, isSelected } ) {
	const isDisabled = useContext( Disabled.Context );

	return (
		<div { ...useBlockProps( { className: 'block-library-html__edit' } ) }>
			{ ( ! isSelected && '' !== attributes.content.trim() ) ||
			isDisabled ? (
				<Preview
					content={ attributes.content }
					isSelected={ isSelected }
				/>
			) : (
				<PlainText
					value={ attributes.content }
					onChange={ ( content ) => setAttributes( { content } ) }
					placeholder={ __( 'Write HTML…' ) }
					aria-label={ __( 'HTML' ) }
				/>
			) }
		</div>
	);
}
