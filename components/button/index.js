/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component, createElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';

class Button extends Component {
	constructor( props ) {
		super( props );
		this.setRef = this.setRef.bind( this );
		this.focus = this.focus.bind( this );
	}

	componentDidMount() {
		if ( this.props.focus ) {
			this.ref.focus();
		}
	}

	setRef( ref ) {
		this.ref = ref;
	}

	focus() {
		this.ref.focus();
	}

	render() {
		const {
			href,
			target,
			isPrimary,
			isLarge,
			isSmall,
			isToggled,
			isBusy,
			className,
			disabled,
			...additionalProps
		} = this.props;
		const classes = classnames( 'components-button', className, {
			button: ( isPrimary || isLarge ),
			'button-primary': isPrimary,
			'button-large': isLarge,
			'button-small': isSmall,
			'is-toggled': isToggled,
			'is-busy': isBusy,
		} );

		const tag = href !== undefined && ! disabled ? 'a' : 'button';
		const tagProps = tag === 'a' ? { href, target } : { type: 'button', disabled };

		delete additionalProps.focus;

		return createElement( tag, {
			...tagProps,
			...additionalProps,
			className: classes,
			ref: this.setRef,
		} );
	}
}

export default Button;
