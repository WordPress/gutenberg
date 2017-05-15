/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { Component } from 'element';
import PanelBody from 'components/panel/body';
import PanelBodyToggle from 'components/panel/body-toggle';
import FormToggle from 'components/form-toggle';

/**
 * Internal Dependencies
 */
import './style.scss';

class PostStatus extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			opened: true,
		};
		this.toggle = this.toggle.bind( this );
	}

	toggle( event ) {
		event.preventDefault();
		this.setState( {
			opened: ! this.state.opened,
		} );
	}

	render() {
		return (
			<PanelBody>
				<PanelBodyToggle
					onClick={ this.toggle }
					opened={ this.state.opened }
					label={ __( 'Status & Visibility' ) }
				/>
				{ this.state.opened &&
					<div>
						<div className="editor-sidebar-post-status__row">
							<span>{ __( 'Pending review' ) }</span>
							<FormToggle
								checked={ false }
								aria-label={ __( 'Request review for post' ) }
							/>
						</div>
					</div>
				}
			</PanelBody>
		);
	}
}

export default PostStatus;
