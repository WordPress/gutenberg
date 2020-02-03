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

/**
 * Internal dependencies
 */
import Dashicon from '../dashicon';
import VisuallyHidden from '../visually-hidden';

export function ExternalLink(
	{ href, children, className, rel = '', ...additionalProps },
	ref
) {
	rel = uniq(
		compact( [ ...rel.split( ' ' ), 'external', 'noreferrer', 'noopener' ] )
	).join( ' ' );
	const classes = classnames( 'components-external-link', className );
	return (
		<a
			{ ...additionalProps }
			className={ classes }
			href={ href }
			// eslint-disable-next-line react/jsx-no-target-blank
			target="_blank"
			rel={ rel }
			ref={ ref }
		>
			{ children }
			<VisuallyHidden as="span">
				{ /* translators: accessibility text */
				__( '(opens in a new tab)' ) }
			</VisuallyHidden>
			<Dashicon
				icon="external"
				className="components-external-link__icon"
			/>
		</a>
	);
}

export default forwardRef( ExternalLink );
