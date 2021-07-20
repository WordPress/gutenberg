/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

export default function creditsSave( { attributes } ) {
	const { textAlign, content } = attributes;
	const className = classnames( {
		[ `has-text-align-${ textAlign }` ]: textAlign,
	} );
	const blockProps = useBlockProps.save( { className } );
	return <p { ...blockProps }>{ content }</p>;
}
