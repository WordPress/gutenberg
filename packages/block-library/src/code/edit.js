/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { PlainText } from '@wordpress/block-editor';
import { escape, unescape } from './utils';

export default function CodeEdit( { attributes, setAttributes, className } ) {
	return (
		<div className={ className }>
			<PlainText
				value={ unescape( attributes.content ) }
				onChange={ ( content ) => setAttributes( { content: escape( content ) } ) }
				placeholder={ __( 'Write code…' ) }
				aria-label={ __( 'Code' ) }
			/>
		</div>
	);
}
