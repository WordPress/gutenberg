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
	makeAlignmentUpdater( alignment ) {
		return () => this.props.onSelection( alignment );
	}

	render() {
		const toolbarControls = [
			{
				icon: valignTop,
				title: _x( 'V-align Top', 'Block vertical alignment setting' ),
				isActive: this.props.alignment === 'top',
				onClick: this.makeAlignmentUpdater( 'top' ),
			},
			{
				icon: valignCenter,
				title: _x( 'V-align Middle', 'Block vertical alignment setting' ),
				isActive: this.props.alignment === 'center',
				onClick: this.makeAlignmentUpdater( 'center' ),
			},
			{
				icon: valignBottom,
				title: _x( 'V-align Bottom', 'Block vertical alignment setting' ),
				isActive: this.props.alignment === 'bottom',
				onClick: this.makeAlignmentUpdater( 'bottom' ),
			},
		];

		return (
			<Toolbar controls={ toolbarControls } />
		);
	}
}

VAlignToolbar.defaultProps = {
	alignment: null,
};

export default VAlignToolbar;
