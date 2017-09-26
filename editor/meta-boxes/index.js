/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { Panel, PanelBody, Dashicon } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';

class MetaBoxes extends Component {
	constructor() {
		super( ...arguments );

		this.toggle = this.toggle.bind( this );

		this.state = {
			isOpen: false,
		};
	}

	toggle() {
		this.setState( {
			isOpen: ! this.state.isOpen,
		} );
	}

	render() {
		const { isOpen } = this.state;

		return (
			<Panel className="editor-meta-boxes">
				<PanelBody
					title={ __( 'Extended Settings' ) }
					opened={ isOpen }
					onToggle={ this.toggle }>
					<div className="editor-meta-boxes__coming-soon">
						<Dashicon icon="flag" />
						<h3>{ __( 'Coming Soon' ) }</h3>
						<p>{ __( 'Meta boxes are not yet supported, but are planned for a future release.' ) }</p>
					</div>
				</PanelBody>
			</Panel>
		);
	}
}

export default MetaBoxes;
