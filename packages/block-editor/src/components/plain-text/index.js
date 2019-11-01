
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
 * Constants
 */
const REGEXP_NEWLINES = /[\r\n]+/g;

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/plain-text/README.md
 */
const PlainText = forwardRef( ( {
	onChange,
	className,
	multiline,
	isStylable,
	...props
}, ref ) => {
	const handleChange = ( event ) => {
		const { value } = event.target;

		if ( multiline ) {
			onChange( value );
			return;
		}

		onChange( value.replace( REGEXP_NEWLINES, ' ' ) );
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
