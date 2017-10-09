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
import UrlInput from './';
import ToggleControl from '../inspector-controls/toggle-control';
import { filterURLForDisplay } from '../../editor/utils/url';

const DISPLAY_STEP = 'DISPLAY';
const EDIT_STEP = 'EDIT';
const SETTINGS_STEP = 'SETTINGS';

const ALL_STEPS = [ EDIT_STEP, SETTINGS_STEP, DISPLAY_STEP ];

const defaultState = {
	expanded: false,
	currentStep: 0,
	isDeleted: false,
};

class UrlInputButton extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			...defaultState,
			url: this.props.url,
			opensInNewWindow: this.props.opensInNewWindow,
		};

		this.onLinkButtonClick = this.onLinkButtonClick.bind( this );
		this.onSubmit = this.onSubmit.bind( this );
		this.changeLink = this.changeLink.bind( this );
		this.deleteLink = this.deleteLink.bind( this );
		this.onBack = this.onBack.bind( this );
		this.toggleOpensInNewWindow = this.toggleOpensInNewWindow.bind( this );
	}

	componentWillReceiveProps( nextProps ) {
		if ( nextProps.selectedNodeId !== this.props.selectedNodeId ) {
			this.setState( {
				...defaultState,
				url: nextProps.url,
				opensInNewWindow: nextProps.opensInNewWindow,
			} );
		}
	}

	onLinkButtonClick() {
		this.setState( { expanded: true, currentStep: 0, isDeleted: false } );
	}

	onSubmit( event ) {
		event.preventDefault();
		this.changeStep( 1 );
	}

	onBack() {
		this.changeStep( -1 );
	}

	changeStep( dir ) {
		const nextStep = this.state.currentStep + dir;

		if ( nextStep < 0 ) {
			this.setState( { expanded: false, currentStep: 0 } );
			return;
		}

		if ( nextStep > ( this.getSteps().length - 1 ) ) {
			this.props.onChange( { url: this.state.isDeleted ? null : this.state.url, opensInNewWindow: this.state.opensInNewWindow } );
			this.setState( { expanded: false, currentStep: 0 } );
			return;
		}

		this.setState( { currentStep: nextStep } );
	}

	deleteLink() {
		this.setState( { url: '', isDeleted: true } );
	}

	changeLink( url ) {
		this.setState( { url } );
	}

	toggleOpensInNewWindow() {
		this.setState( { opensInNewWindow: ! this.state.opensInNewWindow } );
	}

	getSteps() {
		return ALL_STEPS.filter( step => {
			if ( step === DISPLAY_STEP ) {
				return !! this.state.url && ! this.state.isDeleted;
			} else if ( step === SETTINGS_STEP ) {
				return this.props.showSettings && ! this.state.isDeleted;
			}

			return true;
		} );
	}

	renderStep( steps ) {
		const { currentStep, url, isDeleted, opensInNewWindow } = this.state;

		switch ( steps[ currentStep ] ) {
			case EDIT_STEP:
				return [
					<UrlInput key="urlinput" value={ url || '' } onChange={ this.changeLink } required={ ! isDeleted } />,
					<IconButton key="iconbutton"
						className="blocks-url-input__unlink"
						icon="dismiss" label={ __( 'Un-link' ) }
						disabled={ ! url } onClick={ this.deleteLink } />,
				];

			case DISPLAY_STEP:
				return [
					<a
						key="a"
						className="blocks-format-toolbar__link-value"
						href={ url }
						target="_blank">
						{ url && filterURLForDisplay( decodeURI( url ) ) }
					</a>,
				];

			case SETTINGS_STEP:
				return [
					<fieldset key="fieldset" className="blocks-format-toolbar__link-settings">
						<ToggleControl
							label={ __( 'Open in new window' ) }
							checked={ opensInNewWindow }
							onChange={ this.toggleOpensInNewWindow } />
					</fieldset>,
				];
		}

		return [];
	}

	render() {
		const { expanded, url, currentStep } = this.state;
		const steps = this.getSteps();
		const isLastStep = currentStep === ( steps.length - 1 );

		return (
			<li className="blocks-url-input__button">
				<IconButton
					icon="admin-links"
					label={ __( 'Edit Link' ) }
					onClick={ this.onLinkButtonClick }
					className={ classnames( 'components-toolbar__control', {
						'is-active': url,
					} ) }
				/>
				<CSSTransitionGroup
					transitionName={ {
						enter: 'is-entering',
						enterActive: 'is-entering-active',
						leave: 'is-leaving',
						leaveActive: 'is-leaving-active' } }
					transitionEnterTimeout={ 250 }
					transitionLeaveTimeout={ 250 } >
					{ expanded &&
					<form
						className="blocks-format-toolbar__link-modal"
						onSubmit={ this.onSubmit }>
						<IconButton
							className="blocks-url-input__back"
							icon="arrow-left-alt2"
							label={ __( 'Close' ) }
							onClick={ this.onBack }
						/>
						{ this.renderStep( steps ) }
						<IconButton
							className="blocks-url-input__forward"
							icon={ isLastStep ? 'yes' : 'arrow-right-alt2' }
							label={ isLastStep ? __( 'Submit' ) : __( 'Forward' ) }
							type="submit"
						/>
					</form>
					}
				</CSSTransitionGroup>
			</li>
		);
	}
}

UrlInputButton.defaultProps = {
	showSettings: true,
};

export default UrlInputButton;
