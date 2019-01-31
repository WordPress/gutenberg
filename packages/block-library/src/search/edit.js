/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { RichText, InspectorControls } from '@wordpress/editor';
import { PanelBody, TextControl } from '@wordpress/components';

export default function SearchEdit( { attributes, setAttributes } ) {
	const { label, placeholder } = attributes;

	return (
		<Fragment>
			<div className="wp-block-search">
				<RichText
					tagName="div"
					className="wp-block-search__label"
					value={ label }
					formattingControls={ [] }
					onChange={ ( text ) => setAttributes( { label: text } ) }
				/>
				<input
					type="search"
					className="wp-block-search__input"
					value=""
					placeholder={ placeholder }
				/>
			</div>
			<InspectorControls>
				<PanelBody title={ __( 'Search Settings' ) }>
					<TextControl
						label={ __( 'Placeholder Text' ) }
						value={ placeholder }
						onChange={ ( text ) => setAttributes( { placeholder: text } ) }
					/>
				</PanelBody>
			</InspectorControls>
		</Fragment>
	);
}
