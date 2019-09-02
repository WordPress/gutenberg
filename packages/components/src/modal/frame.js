/**
 * WordPress dependencies
 */
import { Component, createRef } from '@wordpress/element';
import { focus } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import withConstrainedTabbing from '../higher-order/with-constrained-tabbing';

class ModalFrame extends Component {
	constructor() {
		super( ...arguments );

		this.containerRef = createRef();
		this.focusFirstTabbable = this.focusFirstTabbable.bind( this );
	}

	/**
	 * Focuses the first tabbable element when props.focusOnMount is true.
	 */
	componentDidMount() {
		// Focus on mount
		if ( this.props.focusOnMount ) {
			this.focusFirstTabbable();
		}
	}

	/**
	 * Focuses the first tabbable element.
	 */
	focusFirstTabbable() {
		const tabbables = focus.tabbable.find( this.containerRef.current );
		if ( tabbables.length ) {
			tabbables[ 0 ].focus();
		}
	}

	/**
	 * Renders the modal frame element.
	 *
	 * @return {WPElement} The modal frame element.
	 */
	render() {
		const {
			contentLabel,
			aria: {
				describedby,
				labelledby,
			},
			children,
			className,
			role,
			style,
		} = this.props;

		return (
			<div
				className={ className }
				style={ style }
				ref={ this.containerRef }
				role={ role }
				aria-label={ contentLabel }
				aria-labelledby={ contentLabel ? null : labelledby }
				aria-describedby={ describedby }
				tabIndex="-1"
			>
				{ children }
			</div>
		);
	}
}

export default withConstrainedTabbing( ModalFrame );
