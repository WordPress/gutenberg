/**
 * External dependencies
 */
import classnames from 'classnames';
import { isArray, isString } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Tooltip from '../tooltip';
import Button from '../button';
import Dashicon from '../dashicon';

// This is intentionally a Component class, not a function component because it
// is common to apply a ref to the button element (only supported in class)
class IconButton extends Component {
	render() {
		const { icon, children, label, className, tooltip, shortcut, labelPosition, ...additionalProps } = this.props;
		const { 'aria-pressed': ariaPressed } = this.props;
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

		let element = (
			<Button aria-label={ label } { ...additionalProps } className={ classes }>
				{ isString( icon ) ? <Dashicon icon={ icon } ariaPressed={ ariaPressed } /> : icon }
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
}

export default IconButton;
