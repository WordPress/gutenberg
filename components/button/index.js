/**
 * External dependencies
 */
import './style.scss';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component, createElement } from '@wordpress/element';

class Button extends Component {
	constructor( props ) {
		super( props );
		this.setRef = this.setRef.bind( this );
	}

	componentDidMount() {
		if ( this.props.focus ) {
			this.ref.focus();
		}
	}

	setRef( ref ) {
		this.ref = ref;
	}

	render() {
		const {
			href,
			target,
			isPrimary,
			isSecondary,
			isLarge,
			isSmall,
			isToggled,
			className,
			disabled,
			...additionalProps
		} = this.props;
		const classes = classnames( 'components-button', className, {
			button: ( isPrimary || isSecondary || isLarge ),
			'button-primary': isPrimary,
			'button-secondary': isSecondary,
			'button-large': isLarge,
			'button-small': isSmall,
			'is-toggled': isToggled,
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
