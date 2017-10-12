
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { IconButton, withFocusReturnWrapperProps } from '@wordpress/components';

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

export class LinkSettings extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			currentStep: 0,
			isDeleted: false,
			url: this.props.url,
			opensInNewWindow: this.props.opensInNewWindow,
		};

		this.onSubmit = this.onSubmit.bind( this );
		this.changeLink = this.changeLink.bind( this );
		this.deleteLink = this.deleteLink.bind( this );
		this.onBack = this.onBack.bind( this );
		this.toggleOpensInNewWindow = this.toggleOpensInNewWindow.bind( this );
	}

	componentWillReceiveProps( nextProps ) {
		if ( nextProps.linkId !== this.props.linkId ) {
			this.setState( {
				currentStep: 0,
				isDeleted: false,
				url: nextProps.url,
				opensInNewWindow: nextProps.opensInNewWindow,
			} );
		}
	}

	getSteps() {
		return ALL_STEPS.filter( step => {
			if ( step === DISPLAY_STEP ) {
				return !! this.state.url && ! this.state.isDeleted;
			} else if ( step === SETTINGS_STEP ) {
				return this.props.showOpensInNewWindow && ! this.state.isDeleted;
			}

			return true;
		} );
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
			this.setState( { currentStep: 0 } );
			this.props.onCancel();
			return;
		} else if ( nextStep > ( this.getSteps().length - 1 ) ) {
			this.setState( { currentStep: 0 } );
			this.props.onChange( { url: this.state.isDeleted ? null : this.state.url, opensInNewWindow: this.state.opensInNewWindow } );
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
		const { currentStep } = this.state;
		const steps = this.getSteps();
		const isLastStep = currentStep === ( steps.length - 1 );

		return (
			<form
				tabIndex="-1"
				style={ { minWidth: this.props.minWidth || 0 } }
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
			</form> );
	}

}

export default withFocusReturnWrapperProps( { className: 'blocks-format-toolbar__link-modal' } )( LinkSettings );
