/**
 * External dependencies
 */
import classnames from 'classnames';
import { compact, uniq } from 'lodash';
import { Component } from '../../element';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Dashicon from '../dashicon';
import Button from '../button';
import './style.scss';

class ExternalLink extends Component {
	getRel() {
		const { rel = '', ...additionalProps } = this.props;

		if ( rel === null || additionalProps.disabled ) {
			return null;
		}

		return uniq( compact( [
			...rel.split( ' ' ),
			'external',
			'noreferrer',
			'noopener',
		] ) ).join( ' ' );
	}

	render() {
		const {
			href,
			target,
			icon = true,
			children,
			className,
			...additionalProps
		} = this.props;

		const isDisabled = additionalProps.disabled;

		const classes = classnames( 'components-external-link', className, {
			'components-icon-button': icon && (
				additionalProps.isPrimary || additionalProps.isLarge || additionalProps.isSmall
			),
		} );

		const targetToUse = target || '_blank';

		return (
			<Button { ...additionalProps } className={ classes } href={ href } target={ targetToUse } rel={ this.getRel() }>
				{ children }
				{ ! isDisabled && <span className="screen-reader-text">
					{
						// We need a space to separate this from previous text.
						' ' +
						/* translators: accessibility text */
						__( '(opens in a new tab)' )
					}
				</span> }
				{ icon && <Dashicon icon="external" /> }
			</Button>
		);
	}
}

export default ExternalLink;
