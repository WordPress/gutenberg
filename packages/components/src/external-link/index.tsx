/**
 * External dependencies
 */
import clsx from 'clsx';
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { __, isRTL } from '@wordpress/i18n';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { ExternalLinkProps } from './types';
import type { WordPressComponentProps } from '../context';

function UnforwardedExternalLink(
	props: Omit<
		WordPressComponentProps< ExternalLinkProps, 'a', false >,
		'target'
	>,
	ref: ForwardedRef< HTMLAnchorElement >
) {
	const { href, children, className, rel = '', ...additionalProps } = props;
	const optimizedRel = [
		...new Set(
			[
				...rel.split( ' ' ),
				'external',
				'noreferrer',
				'noopener',
			].filter( Boolean )
		),
	].join( ' ' );
	const classes = clsx( 'components-external-link', className );
	/* Anchor links are perceived as external links.
	This constant helps check for on page anchor links,
	to prevent them from being opened in the editor. */
	const isInternalAnchor = !! href?.startsWith( '#' );

	const onClickHandler = (
		event: React.MouseEvent< HTMLAnchorElement, MouseEvent >
	) => {
		if ( isInternalAnchor ) {
			event.preventDefault();
		}

		if ( props.onClick ) {
			props.onClick( event );
		}
	};

	return (
		/* eslint-disable react/jsx-no-target-blank */
		<a
			{ ...additionalProps }
			className={ classes }
			href={ href }
			onClick={ onClickHandler }
			target="_blank"
			rel={ optimizedRel }
			ref={ ref }
		>
			<span className="components-external-link__contents">
				{ children }
			</span>
			<span
				className={ clsx(
					'components-external-link__icon',
					// This class prevents the arrow from being replaced by a Twemoji image.
					'wp-exclude-emoji'
				) }
				aria-label={
					/* translators: accessibility text */
					__( '(opens in a new tab)' )
				}
			>
				{ isRTL() ? '\u2196' : '\u2197' }
			</span>
		</a>
		/* eslint-enable react/jsx-no-target-blank */
	);
}

/**
 * Link to an external resource.
 *
 * ```jsx
 * import { ExternalLink } from '@wordpress/components';
 *
 * const MyExternalLink = () => (
 *   <ExternalLink href="https://wordpress.org">WordPress.org</ExternalLink>
 * );
 * ```
 */
export const ExternalLink = forwardRef( UnforwardedExternalLink );
ExternalLink.displayName = 'ExternalLink';

export default ExternalLink;
