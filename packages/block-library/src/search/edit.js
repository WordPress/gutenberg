/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';

export default function SearchEdit( { className, attributes, setAttributes } ) {
	const { label, placeholder, buttonText } = attributes;

	return (
		<div className={ classnames( className, 'wp-block-search' ) }>
			<RichText
				wrapperClassName="wp-block-search__label"
				value={ label }
				placeholder={ __( 'Add label' ) }
				keepPlaceholderOnFocus
				formattingControls={ [] }
				onChange={ ( html ) => setAttributes( { label: html } ) }
			/>
			<input
				className="wp-block-search__input"
				value={ placeholder }
				placeholder={ __( 'Optional placeholder' ) }
				onChange={ ( event ) => setAttributes( { placeholder: event.target.value } ) }
			/>
			<RichText
				wrapperClassName="wp-block-search__button"
				className="wp-block-search__button-rich-text"
				value={ buttonText }
				placeholder={ __( 'Add button text' ) }
				keepPlaceholderOnFocus
				formattingControls={ [] }
				onChange={ ( html ) => setAttributes( { buttonText: html } ) }
			/>
		</div>
	);
}
