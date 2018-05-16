/**
 * External dependencies
 */
import classnames from 'classnames';
import { compact, uniq, includes, omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { createElement, forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Dashicon from '../dashicon';
import './style.scss';

export function Button( props, ref ) {
	const {
		href,
		target,
		rel = '',
		isPrimary,
		isLarge,
		isSmall,
		isToggled,
		isBusy,
		className,
		disabled,
		focus,
		children,
		...additionalProps
	} = props;

	const tag = href !== undefined && ! disabled ? 'a' : 'button';
	const tagProps = tag === 'a' ? { href, target, rel } : { type: 'button', disabled };
	const { icon = true } = additionalProps;
	const isExternalLink = href && ( target && ! includes( [ '_self', '_parent', '_top' ], target ) );

	const classes = classnames( 'components-button', className, {
		button: ( isPrimary || isLarge || isSmall ),
		'button-primary': isPrimary,
		'button-large': isLarge,
		'button-small': isSmall,
		'is-toggled': isToggled,
		'is-busy': isBusy,
		'external-link': isExternalLink,
		'components-icon-button': isExternalLink && icon && ( isPrimary || isLarge || isSmall ),
	} );

	const getRel = () => {
		// Allow to omit the `rel` attribute passing a `null` value.
		return rel === null ? rel : uniq( compact( [
			...rel.split( ' ' ),
			'external',
			'noreferrer',
			'noopener',
		] ) ).join( ' ' );
	};

	const { opensInNewTabText = __(
		/* translators: accessibility text */
		'(opens in a new tab)'
	) } = additionalProps;

	const OpensInNewTabScreenReaderText = isExternalLink && (
		<span className="screen-reader-text">
			{
				// We need a space to separate this from previous text.
				' ' + opensInNewTabText
			}
		</span>
	);

	const ExternalIcon = icon && isExternalLink && <Dashicon icon="external" />;

	return createElement( tag, {
		...tagProps,
		...omit( additionalProps, [ 'icon', 'opensInNewTabText' ] ),
		className: classes,
		autoFocus: focus,
		rel: isExternalLink && getRel(),
		ref,
	}, children, OpensInNewTabScreenReaderText, ExternalIcon );
}

export default forwardRef( Button );
