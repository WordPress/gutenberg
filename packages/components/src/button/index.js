/**
 * External dependencies
 */
import classnames from 'classnames';
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import Link from '../link';

export function Button( props, ref ) {
	const {
		isPrimary,
		isLarge,
		isSmall,
		isToggled,
		isBusy,
		isUnstyled,
		hasLinkAppearance,
		isDestructive,
		className,
		...additionalProps
	} = props;

	if ( props.hasOwnProperty( 'isLink' ) ) {
		deprecated( 'Button isLink prop', {
			alternative: 'hasLinkAppearance prop',
			plugin: 'Gutenberg',
			version: '4.1',
			hint: (
				'This prop is being renamed to reflect that link appearance ' +
				'is cosmetic and should not be mistaken for semantics of a ' +
				'link, which are otherwise represented by the Link component.'
			),
		} );

		props = {
			...omit( props, 'isLink' ),
			hasLinkAppearance: props.isLink,
		};
	}

	if ( props.hasOwnProperty( 'href' ) ) {
		deprecated( 'Button href prop', {
			alternative: 'Link component',
			plugin: 'Gutenberg',
			version: '4.1',
		} );

		return <Link { ...props } />;
	}

	let { isBorderless } = props;
	if ( props.hasOwnProperty( 'isDefault' ) ) {
		deprecated( 'Button isDefault prop', {
			plugin: 'Gutenberg',
			version: '4.1',
			hint: (
				'It is no longer necessary to pass this prop because the ' +
				'default appearance is now the default. The prior default, ' +
				'a borderless style, is now effected via the isBorderless prop'
			),
		} );

		isBorderless = isBorderless || ! props.isDefault;
	}

	const classes = classnames( 'components-button', className, {
		'is-unstyled': isUnstyled,
		'is-borderless': isBorderless,
		'is-primary': isPrimary,
		'is-large': isLarge,
		'is-small': isSmall,
		'is-toggled': isToggled,
		'is-busy': isBusy,
		'has-link-appearance': hasLinkAppearance,
		'is-destructive': isDestructive,
	} );

	return (
		<button
			ref={ ref }
			type="button"
			{ ...additionalProps }
			className={ classes }
		/>
	);
}

export default forwardRef( Button );
