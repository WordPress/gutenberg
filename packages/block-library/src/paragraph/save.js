/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	RichText,
	__experimentalUseBlockWrapperProps as useBlockWrapperProps,
} from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { align, content, dropCap, direction } = attributes;
	const className = classnames( {
		'has-drop-cap': dropCap,
		[ `has-text-align-${ align }` ]: align,
	} );

	return (
		<p { ...useBlockWrapperProps.save( { className, dir: direction } ) }>
			<RichText.Content value={ content } />
		</p>
	);
}
