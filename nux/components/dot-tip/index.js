/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Button, Popover } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import { tipHasBeenShown } from '../../store/selectors';
import { markAsShown } from '../../store/actions';

class DotTip extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			opened: false,
		};
		this.showTip = this.showTip.bind( this );
		this.closeTip = this.closeTip.bind( this );
	}

	showTip() {
		this.setState( { opened: true } );
		this.props.markAsShown( this.props.id );
	}

	closeTip() {
		this.setState( { opened: false } );
	}

	render() {
		const { hasBeenShown, children } = this.props;
		const { opened } = this.state;

		if ( hasBeenShown && ! opened ) {
			return null;
		}

		return (
			<div className="nux-dot-tip">
				<Button className="nux-dot-tip__button-container" onClick={ this.showTip }>
					<div className="nux-dot-tip__button">{ __( 'Show Tip' ) }</div>
				</Button>
				<Popover
					className="nux-dot-tip__content"
					isOpen={ opened }
					onClose={ this.closeTip }
					position="center right"
				>
					{ children }
				</Popover>
			</div>
		);
	}
}

export default connect(
	( state, ownProps ) => ( {
		hasBeenShown: tipHasBeenShown( state, ownProps.id ),
	} ),
	{ markAsShown },
	undefined,
	{ storeKey: 'core/nux' }
)( DotTip );
