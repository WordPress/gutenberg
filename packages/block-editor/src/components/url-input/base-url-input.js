/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { BaseControl } from '@wordpress/components';
import { forwardRef } from '@wordpress/element';

const BaseURLInput = forwardRef( ( props, ref ) => {
	const {
		id,
		className,
		label,
		isFullWidth,
		hasBorder,
		children,
		...inputProps
	} = props;

	return (
		<BaseControl
			label={ label }
			id={ id }
			className={ classnames( 'block-editor-url-input', className, {
				'is-full-width': isFullWidth,
				'has-border': hasBorder,
			} ) }
		>
			<input
				ref={ ref }
				type="text"
				{ ...inputProps }
			/>
			{ children }
		</BaseControl>
	);
} );

export default BaseURLInput;
