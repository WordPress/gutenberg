/**
 * WordPress dependencies
 */
import { Toolbar } from '@wordpress/components';
import { Component } from '@wordpress/element';
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { valignTop, valignCenter, valignBottom } from './icons';

class VAlignToolbar extends Component {
	constructor( props ) {
		super( props );

		this.toolbarControls = [
			{
				icon: valignTop,
				title: _x( 'V-align Top', 'Block vertical alignment setting' ),
				isActive: this.props.verticalAlignment === 'top',
				onClick: this.makeAlignmentUpdater( 'top' ),
			},
			{
				icon: valignCenter,
				title: _x( 'V-align Middle', 'Block vertical alignment setting' ),
				isActive: this.props.verticalAlignment === 'center',
				onClick: this.makeAlignmentUpdater( 'center' ),
			},
			{
				icon: valignBottom,
				title: _x( 'V-align Bottom', 'Block vertical alignment setting' ),
				isActive: this.props.verticalAlignment === 'bottom',
				onClick: this.makeAlignmentUpdater( 'bottom' ),
			},
		];
	}

	makeAlignmentUpdater( alignment ) {
		return () => this.props.setAttributes( { verticalAlignment: alignment } );
	}

	render() {
		return (
			<Toolbar controls={ this.toolbarControls } />
		);
	}
}

VAlignToolbar.defaultProps = {
	verticalAlignment: 'top',
};

export default VAlignToolbar;
