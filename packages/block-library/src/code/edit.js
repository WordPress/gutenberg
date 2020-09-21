/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	PlainText,
	__experimentalUseBlockWrapperProps as useBlockWrapperProps,
} from '@wordpress/block-editor';

export default function CodeEdit( { attributes, setAttributes } ) {
	const blockWrapperProps = useBlockWrapperProps();
	return (
		<pre { ...blockWrapperProps }>
			<PlainText
				__experimentalVersion={ 2 }
				tagName="code"
				value={ attributes.content }
				onChange={ ( content ) => setAttributes( { content } ) }
				placeholder={ __( 'Write code…' ) }
				aria-label={ __( 'Code' ) }
			/>
		</pre>
	);
}
