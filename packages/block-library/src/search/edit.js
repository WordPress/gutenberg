/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

export default function SearchEdit( { className, attributes, setAttributes } ) {
	const { label, placeholder, buttonText } = attributes;

	return (
		<div className={ className }>
			<RichText
				className="wp-block-search__label"
				aria-label={ __( 'Label text' ) }
				placeholder={ __( 'Add label…' ) }
				withoutInteractiveFormatting
				value={ label }
				onChange={ ( html ) => setAttributes( { label: html } ) }
			/>
			<input
				className="wp-block-search__input"
				aria-label={ __( 'Optional placeholder text' ) }
				// We hide the placeholder field's placeholder when there is a value. This
				// stops screen readers from reading the placeholder field's placeholder
				// which is confusing.
				placeholder={
					placeholder ? undefined : __( 'Optional placeholder…' )
				}
				value={ placeholder }
				onChange={ ( event ) =>
					setAttributes( { placeholder: event.target.value } )
				}
			/>
			<RichText
				className="wp-block-search__button"
				aria-label={ __( 'Button text' ) }
				placeholder={ __( 'Add button text…' ) }
				withoutInteractiveFormatting
				value={ buttonText }
				onChange={ ( html ) => setAttributes( { buttonText: html } ) }
			/>
		</div>
	);
}
