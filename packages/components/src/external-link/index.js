/**
 * External dependencies
 */
import classnames from 'classnames';
import { compact, uniq } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { forwardRef } from '@wordpress/element';
import { external } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { VisuallyHidden } from '../visually-hidden';
import { StyledIcon } from './styles/external-link-styles';

export function ExternalLink(
	{ href, children, className, rel = '', ...additionalProps },
	ref
) {
	rel = uniq(
		compact( [ ...rel.split( ' ' ), 'external', 'noreferrer', 'noopener' ] )
	).join( ' ' );
	const classes = classnames( 'components-external-link', className );
	return (
		/* eslint-disable react/jsx-no-target-blank */
		<a
			{ ...additionalProps }
			className={ classes }
			href={ href }
			target="_blank"
			rel={ rel }
			ref={ ref }
		>
			{ children }
			<VisuallyHidden as="span">
				{
					/* translators: accessibility text */
					__( '(opens in a new tab)' )
				}
			</VisuallyHidden>
			<StyledIcon
				icon={ external }
				className="components-external-link__icon"
			/>
		</a>
		/* eslint-enable react/jsx-no-target-blank */
	);
}

export default forwardRef( ExternalLink );
