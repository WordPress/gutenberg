/**
 * External dependencies
 */
//import TextareaAutosize from 'react-autosize-textarea/src';
import classnames from 'classnames';

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
		<textarea
			ref={ ref }
			className={ classnames( 'block-editor-plain-text', className ) }
			onChange={ ( event ) => onChange( event.target.value ) }
			{ ...remainingProps }
		/>
	);
} );

export default PlainText;
