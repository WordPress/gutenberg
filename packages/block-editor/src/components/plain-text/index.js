/**
 * External dependencies
 */
import TextareaAutosize from 'react-autosize-textarea';
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import EditableText from '../editable-text';

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/plain-text/README.md
 */
const PlainText = forwardRef( ( { __experimentalVersion, ...props }, ref ) => {
	if ( __experimentalVersion === 2 ) {
		return <EditableText ref={ ref } { ...props } />;
	}

	const { className, onChange, ...remainingProps } = props;

	return (
		<TextareaAutosize
			ref={ ref }
			className={ clsx( 'block-editor-plain-text', className ) }
			onChange={ ( event ) => onChange( event.target.value ) }
			{ ...remainingProps }
		/>
	);
} );

export default PlainText;
