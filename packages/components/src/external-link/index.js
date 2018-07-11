/**
 * External dependencies
 */
import classnames from 'classnames';
import { compact, uniq } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Dashicon from '../dashicon';

function ExternalLink( {
	href,
	children,
	className,
	iconClassName,
	rel = '',
	...additionalProps
} ) {
	rel = uniq( compact( [
		...rel.split( ' ' ),
		'external',
		'noreferrer',
		'noopener',
	] ) ).join( ' ' );

	const classes = classnames( 'components-external-link', className );
	const iconClasses = classnames( 'components-external-link__icon', iconClassName );

	return (
		<a { ...additionalProps } className={ classes } href={ href } target="_blank" rel={ rel }>
			{ children }
			<span className="screen-reader-text">
				{
					/* translators: accessibility text */
					__( '(opens in a new window)' )
				}
			</span>
			<Dashicon className={ iconClasses } icon="external" />
		</a>
	);
}

export default ExternalLink;
