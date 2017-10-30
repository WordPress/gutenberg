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
	}

	componentWillReceiveProps( nextProps ) {
		// consider blurring and improve checking here.
		if ( this.props.focus !== nextProps.focus && nextProps.focus ) {
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
			isLarge,
			isSmall,
			isToggled,
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

export default Button
