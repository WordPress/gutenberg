/**
 * External dependencies
 */
import classnames from 'classnames';
import { compact, uniq } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Dashicon from '../dashicon';
import Button from '../button';
import './style.scss';

class ExternalLink extends Component {
	getRel() {
		const { rel = '' } = this.props;

		// Allow to omit the `rel` attribute passing a `null` value.
		return rel === null ? rel : uniq( compact( [
			...rel.split( ' ' ),
			'external',
			'noreferrer',
			'noopener',
		] ) ).join( ' ' );
	}

	renderOpensInNewTabText() {
		const { opensInNewTabText = __(
			/* translators: accessibility text */
			'(opens in a new tab)'
		) } = this.props;

		return (
			<span className="screen-reader-text">
				{
					// We need a space to separate this from previous text.
					' ' + opensInNewTabText
				}
			</span>
		);
	}

	render() {
		const {
			href,
			target = '_blank',
			icon = true,
			children,
			className,
			...additionalProps
		} = this.props;

		const { disabled, isPrimary, isLarge, isSmall } = additionalProps;
		const isDisabled = disabled || ! href;
		const classes = classnames( 'components-external-link', className, {
			'components-icon-button': icon && ( isPrimary || isLarge || isSmall ),
		} );

		return (
			<Button
				{ ...additionalProps }
				href={ href }
				target={ target }
				rel={ this.getRel() }
				disabled={ isDisabled }
				className={ classes }
			>
				{ children }
				{ ! isDisabled && this.renderOpensInNewTabText() }
				{ icon && <Dashicon icon="external" /> }
			</Button>
		);
	}
}

export default ExternalLink;
