
/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * External dependencies
 */
import TextareaAutosize from 'react-autosize-textarea';
import classnames from 'classnames';

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/plain-text/README.md
 */
const PlainText = forwardRef( ( {
	onChange,
	className,
	isSingleLine,
	isStylable,
	...props
}, ref ) => {
	const handleChange = ( event ) => {
		const { value } = event.target;

		if ( ! isSingleLine ) {
			onChange( value );
			return;
		}

		onChange( value.replace( /[\n\r\t]+/g, ' ' ) );
	};

	return (
		<TextareaAutosize
			ref={ ref }
			className={ classnames(
				'editor-plain-text block-editor-plain-text',
				className,
				{ 'is-stylable': isStylable }
			) }
			onChange={ handleChange }
			{ ...props }
		/>
	);
} );

export default PlainText;
