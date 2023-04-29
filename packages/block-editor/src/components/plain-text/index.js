/**
 * External dependencies
 */
import TextareaAutosize from 'react-autosize-textarea';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import EditableText from '../editable-text';

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/plain-text/README.md
 */
const PlainText = forwardRef( ( { version, ...props }, ref ) => {
	if ( version === 2 ) {
		return <EditableText ref={ ref } { ...props } />;
	}

	deprecated( 'Version 1 of `<PlainText>`', {
		since: '6.0',
		alternative: '`version={2}`',
	} );

	const { className, onChange, ...remainingProps } = props;

	return (
		<TextareaAutosize
			ref={ ref }
			className={ classnames( 'block-editor-plain-text', className ) }
			onChange={ ( event ) => onChange( event.target.value ) }
			{ ...remainingProps }
		/>
	);
} );

export default PlainText;
