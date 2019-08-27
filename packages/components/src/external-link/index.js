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

export function ExternalLink( { href, children, className, rel = '', ...additionalProps }, ref ) {
	rel = uniq( compact( [
		...rel.split( ' ' ),
		'external',
		'noreferrer',
		'noopener',
	] ) ).join( ' ' );
	const classes = classnames( 'components-external-link', className );
	return (
		// eslint-disable-next-line react/jsx-no-target-blank
		<a { ...additionalProps } className={ classes } href={ href } target="_blank" rel={ rel } ref={ ref }>
			{ children }
			<span className="screen-reader-text">
				{
					/* translators: accessibility text */
					__( '(opens in a new tab)' )
				}
			</span>
			<Dashicon icon="external" className="components-external-link__icon" />
		</a>
	);
}

export default forwardRef( ExternalLink );
