/**
 * External dependencies
 */
import classnames from 'classnames';
import { compact, uniq } from 'lodash';

/**
 * Internal dependencies
 */
import Dashicon from '../dashicon';
import OpensInNewTabMessage from './opens-in-new-tab-message';
import './style.scss';

function ExternalLink( { href, children, className, rel = '', ...additionalProps } ) {
	rel = uniq( compact( [
		...rel.split( ' ' ),
		'external',
		'noreferrer',
		'noopener',
	] ) ).join( ' ' );
	const classes = classnames( 'components-external-link', className );
	return (
		<a { ...additionalProps } className={ classes } href={ href } target="_blank" rel={ rel }>
			{ children }
			<OpensInNewTabMessage />
			<Dashicon icon="external" />
		</a>
	);
}

export default ExternalLink;
