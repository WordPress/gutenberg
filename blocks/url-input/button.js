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

const DisplayStep = 'DISPLAY';
const EditStep = 'EDIT';
const SettingsStep = 'SETTINGS';

const AllSteps = [ EditStep, SettingsStep, DisplayStep ];

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

		this.toggleExpanded = this.toggleExpanded.bind( this );
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

	toggleExpanded() {
		this.setState( { expanded: ! this.state.expanded } );
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
		return AllSteps.filter( step => {
			if ( step === DisplayStep ) {
				return !! this.state.url && ! this.state.isDeleted;
			} else if ( step === SettingsStep ) {
				return this.props.showSettings && ! this.state.isDeleted;
			}

			return true;
		} );
	}

	renderStep( steps ) {
		const { currentStep, url, isDeleted, opensInNewWindow } = this.state;

		if ( steps[ currentStep ] === EditStep ) {
			return [
				<UrlInput key="urlinput" value={ url || '' } onChange={ this.changeLink } required={ ! isDeleted } />,
				<IconButton key="iconbutton" icon="dismiss" label={ __( 'Un-link' ) } disabled={ ! url } onClick={ this.deleteLink } />,
			];
		} else if ( steps[ currentStep ] === DisplayStep ) {
			return [
				<a
					key="a"
					className="blocks-format-toolbar__link-value"
					href={ url }
					target="_blank">
					{ url && filterURLForDisplay( decodeURI( url ) ) }
				</a>,
			];
		} else if ( steps[ currentStep ] === SettingsStep ) {
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
					onClick={ this.toggleExpanded }
					className={ classnames( 'components-toolbar__control', {
						'is-active': url,
					} ) }
				/>
				<CSSTransitionGroup
					transitionName={ {
						enter: 'is-entering',
						enterActive: 'is-entering-active',
						leave: 'is-leaving',
						leaveActive: 'is-leaving-active' } } >
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
