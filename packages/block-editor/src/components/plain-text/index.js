/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { TextareaControl } from '@wordpress/components';
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

	const { className, ...remainingProps } = props;

	return (
		<TextareaControl
			ref={ ref }
			className={ clsx( 'block-editor-plain-text', className ) }
			__nextHasNoMarginBottom
			{ ...remainingProps }
		/>
	);
} );

export default PlainText;
