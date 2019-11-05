/**
 * External dependencies
 */
import classnames from 'classnames';
import { isArray, isString } from 'lodash';

/**
 * WordPress dependencies
 */
import { cloneElement, forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Tooltip from '../tooltip';
import Button from '../button';
import Icon from '../icon';

function IconButton( props, ref ) {
	const {
		icon,
		children,
		label,
		className,
		tooltip,
		shortcut,
		labelPosition,
		size,
		...additionalProps
	} = props;
	const classes = classnames( 'components-icon-button', className, {
		'has-text': children,
	} );
	const tooltipText = tooltip || label;

	// Should show the tooltip if...
	const showTooltip = ! additionalProps.disabled && (
		// an explicit tooltip is passed or...
		tooltip ||
		// there's a shortcut or...
		shortcut ||
		(
			// there's a label and...
			!! label &&
			// the children are empty and...
			( ! children || ( isArray( children ) && ! children.length ) ) &&
			// the tooltip is not explicitly disabled.
			false !== tooltip
		)
	);

	let buttonIcon = isString( icon ) ?
		<Icon icon={ icon } /> :
		icon;
	if ( size ) {
		buttonIcon = cloneElement( buttonIcon, { size } );
	}

	let element = (
		<Button
			aria-label={ label }
			{ ...additionalProps }
			className={ classes }
			ref={ ref }
		>
			{ buttonIcon }
			{ children }
		</Button>
	);

	if ( showTooltip ) {
		element = (
			<Tooltip text={ tooltipText } shortcut={ shortcut } position={ labelPosition }>
				{ element }
			</Tooltip>
		);
	}

	return element;
}

export default forwardRef( IconButton );
