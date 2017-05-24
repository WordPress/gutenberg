/**
 * External dependencies
 */
import './style.scss';
import classnames from 'classnames';
import { compact, over } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from 'element';

class Button extends Component {
	constructor() {
		super( ...arguments );

		this.setFocused = this.setFocused.bind( this );
		this.checkTooltipBounds = this.checkTooltipBounds.bind( this );
		this.resetBoundedTooltip = this.resetBoundedTooltip.bind( this );

		this.state = {
			hasFocus: false,
			bounded: [],
		};
	}

	setFocused() {
		this.setState( { hasFocus: true } );
	}

	checkTooltipBounds( event ) {
		// Prevent calculating bounded restrictions if the button has no title
		// or if bounds have already been calculated in current hover/focus
		if ( ! this.props.title || this.state.bounded.length ) {
			return;
		}

		const { currentTarget } = event;

		// TODO: Find a better way to determine bounds of the content area,
		// This is implemented with padding on the content element, meaning
		// it's not as simple as referencing the root or body nodes. A better
		// solution would not be tied to specific element IDs but instead
		// offet values calculated from the editor's root layout element.
		const contentTop = document.getElementById( 'wpbody-content' ).getBoundingClientRect().top;

		// Because tooltip is rendered as a pseudo-element, positional offsets
		// are calculated relative the button
		const targetRect = currentTarget.getBoundingClientRect();
		const targetCenter = targetRect.left + ( targetRect.width / 2 );
		const tooltipStyles = window.getComputedStyle( currentTarget, ':after' );
		const tooltipWidth = parseInt( tooltipStyles.width, 10 );
		const tooltipTop = targetRect.top + parseInt( tooltipStyles.top, 10 );
		const tooltipLeft = targetCenter - ( tooltipWidth / 2 );
		const tooltipRight = targetCenter + ( tooltipWidth / 2 );

		this.setState( {
			// If the default position of the tooltip exceeds any bounds of the
			// page content, assign into state so it can be flipped by styling
			bounded: compact( [
				tooltipTop < contentTop ? 'top' : null,
				tooltipLeft < 0 ? 'left' : null,
				tooltipRight > document.documentElement.clientWidth ? 'right' : null,
			] ),
		} );
	}

	resetBoundedTooltip( event ) {
		// If button currently has focus, only reset flipped state when focus
		// leaves, not on mouse out.
		if ( this.state.hasFocus && 'blur' !== event.type ) {
			return;
		}

		this.setState( {
			bounded: [],
			hasFocus: false,
		} );
	}

	render() {
		const { href, isPrimary, isLarge, isToggled, disabled, title, className, ...additionalProps } = this.props;
		const { bounded } = this.state;
		const classes = classnames( 'components-button', className, {
			button: ( isPrimary || isLarge ),
			'button-primary': isPrimary,
			'button-large': isLarge,
			'is-toggled': isToggled,
			'is-disabled': disabled,
		}, bounded.map( ( bound ) => 'is-tooltip-bounded-' + bound ) );

		let tag;
		if ( href ) {
			tag = 'a';
		} else if ( disabled ) {
			// Treat disabled button as styled static element, to avoid needing
			// to handle focus events since we can't assign disabled attribute
			tag = 'span';
		} else {
			tag = 'button';
		}

		const tagProps = tag === 'a' ? { href } : { type: 'button' };

		return wp.element.createElement( tag, {
			...tagProps,
			...additionalProps,
			'aria-label': title,
			// We can't assign a disabled attribute, both because it's invalid
			// for anchor elements, and also because it interferes with mouse
			// events on tooltip bounds check
			'aria-disabled': disabled,
			role: 'button',
			className: classes,
			onClick: disabled ? null : this.props.onClick,
			onFocus: over( this.setFocused, this.checkTooltipBounds, this.props.onFocus ),
			onBlur: over( this.resetBoundedTooltip, this.props.onBlur ),
			onMouseEnter: over( this.checkTooltipBounds, this.props.onMouseEnter ),
			onMouseLeave: over( this.resetBoundedTooltip, this.props.onMouseLeave ),
		} );
	}
}

export default Button;
