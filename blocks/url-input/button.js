/**
 * External dependencies
 */
import classnames from 'classnames';
import CSSTransitionGroup from 'react-transition-group/CSSTransitionGroup';

/**
 * WordPress dependencies
 */
import './style.scss';
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { IconButton } from '@wordpress/components';

/**
 * Internal dependencies
 */
import LinkSettings from './link-settings';
import AncestorSize from './ancestor-size';

class UrlInputButton extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			expanded: false,
			url: this.props.url,
			opensInNewWindow: this.props.opensInNewWindow,
		};

		this.onLinkButtonClick = this.onLinkButtonClick.bind( this );
		this.onSettingsCancel = this.onSettingsCancel.bind( this );
	}

	componentWillReceiveProps( nextProps ) {
		if ( nextProps.selectedNodeId !== this.props.selectedNodeId ) {
			this.setState( {
				expanded: false,
				url: nextProps.url,
				opensInNewWindow: nextProps.opensInNewWindow,
			} );
		}
	}

	onLinkButtonClick() {
		this.setState( { expanded: true } );
	}

	onSettingsCancel() {
		this.setState( { expanded: false } );
	}

	render() {
		const { expanded } = this.state;

		return (
			<li className="blocks-url-input__button">
				<IconButton
					icon="admin-links"
					label={ __( 'Edit Link' ) }
					onClick={ this.onLinkButtonClick }
					className={ classnames( 'components-toolbar__control', {
						'is-active': this.props.url,
					} ) }
				/>
				<AncestorSize ancestorSelector=".editor-block-toolbar__group" >
					{ ( getAncestorSize ) =>
						<CSSTransitionGroup
							transitionName={ {
								enter: 'is-entering',
								enterActive: 'is-entering-active',
								leave: 'is-leaving',
								leaveActive: 'is-leaving-active' } }
							transitionEnterTimeout={ 250 }
							transitionLeaveTimeout={ 250 } >
							{ expanded &&
								<LinkSettings
									linkId={ this.props.selectedNodeId }
									minWidth={ getAncestorSize().width }
									url={ this.props.url }
									showOpensInNewWindow={ this.props.showSettings }
									opensInNewWIndow={ this.props.opensInNewWindow }
									onCancel={ this.onSettingsCancel }
									onChange={ this.props.onChange } />
							}
						</CSSTransitionGroup>
					}
				</AncestorSize>
			</li>
		);
	}
}

UrlInputButton.defaultProps = {
	showSettings: true,
};

export default UrlInputButton;
