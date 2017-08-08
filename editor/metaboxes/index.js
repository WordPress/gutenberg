/**
 * External dependencies
 */
import { connect } from 'react-redux';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { sprintf, __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';

export class Metaboxes extends Component {
	render() {
		const classes = classnames(
			'gutenberg-metaboxes',
			'gutenberg-metaboxes__' + this.props.context
		);

		return (
			<div className={ classes }>
				<h2>{ this.props.headingText }</h2>
				{ this.renderBody() }
			</div>
		);
	}

	renderBody() {
		const { metaboxes, context } = this.props;
		if ( ! metaboxes || ! metaboxes[ context ] ) {
			const noMetaboxesMessage =
				/* translators: %s: metabox context ('normal', 'advanced', 'side') */
				sprintf( __( 'No metaboxes for context: %s' ), context );
			return (
				<div>
					{ noMetaboxesMessage }
				</div>
			);
		}

		return (
			<div
				dangerouslySetInnerHTML={ { __html: metaboxes[ context ] } }
			/>
		);
	}
}

export default connect(
	( state ) => {
		return {
			metaboxes: state.currentPostMetaboxes,
		};
	}
)( Metaboxes );
