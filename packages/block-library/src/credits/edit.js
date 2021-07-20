/**
 * WordPress dependencies
 */
//import { __ } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';
import { useEffect } from '@wordpress/element';

export default function CreditsEdit( {
	attributes: { content },
	setAttributes,
} ) {
	const blockProps = useBlockProps();
	useEffect( () => {
		setAttributes( {
			content,
		} );
	}, [] );
	return <p { ...blockProps }>{ content }</p>;
}
