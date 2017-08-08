/**
 * External dependencies
 */
import classnames from 'classnames';
import { isEqual, pickBy } from 'lodash';

/**
 * WordPress dependencies
 */
import { createPortal, Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import PopoverDetectOutside from './detect-outside';

/**
 * Matches an event handler prop key
 *
 * @type {RegExp}
 */
const REGEXP_EVENT_PROP = /^on[A-Z]/;

export class Popover extends Component {
	constructor() {
		super( ...arguments );

		this.bindNode = this.bindNode.bind( this );
		this.setOffset = this.setOffset.bind( this );
		this.throttledSetOffset = this.throttledSetOffset.bind( this );

		this.nodes = {};

		this.state = {
			forcedYAxis: null,
			forcedXAxis: null,
		};
	}

	componentDidMount() {
		if ( this.props.isOpen ) {
			this.setOffset();
			this.setForcedPositions();
			this.toggleWindowEvents( true );
		}
	}

	componentWillReceiveProps( nextProps ) {
		if ( this.props.position !== nextProps.position ) {
			this.setState( {
				forcedYAxis: null,
				forcedXAxis: null,
			} );
		}
	}

	componentDidUpdate( prevProps, prevState ) {
		const { isOpen, position } = this.props;
		const { isOpen: prevIsOpen, position: prevPosition } = prevProps;
		if ( isOpen !== prevIsOpen ) {
			this.toggleWindowEvents( isOpen );
		}

		if ( ! isOpen ) {
			return;
		}

		if ( isOpen !== prevIsOpen || position !== prevPosition ) {
			this.setOffset();
			this.setForcedPositions();
		} else if ( ! isEqual( this.state, prevState ) ) {
			// Need to update offset if forced positioning applied
			this.setOffset();
		}
	}

	componentWillUnmount() {
		this.toggleWindowEvents( false );
	}

	toggleWindowEvents( isListening ) {
		const handler = isListening ? 'addEventListener' : 'removeEventListener';

		window.cancelAnimationFrame( this.rafHandle );
		window[ handler ]( 'resize', this.throttledSetOffset );
		window[ handler ]( 'scroll', this.throttledSetOffset );
	}

	throttledSetOffset() {
		this.rafHandle = window.requestAnimationFrame( this.setOffset );
	}

	setOffset() {
		const { anchor, popover } = this.nodes;
		const { parentNode } = anchor;
		if ( ! parentNode ) {
			return;
		}

		const rect = parentNode.getBoundingClientRect();

		// Set popover at parent node center
		popover.style.left = Math.round( rect.left + ( rect.width / 2 ) ) + 'px';

		// Set at top or bottom of parent node based on popover position
		const [ yAxis ] = this.getPositions();
		popover.style.top = rect[ yAxis ] + 'px';
	}

	setForcedPositions() {
		const rect = this.nodes.content.getBoundingClientRect();

		// Check exceeding top or bottom of viewport
		if ( rect.top < 0 ) {
			this.setState( { forcedYAxis: 'bottom' } );
		} else if ( rect.bottom > window.innerHeight ) {
			this.setState( { forcedYAxis: 'top' } );
		}

		// Check exceeding left or right of viewport
		if ( rect.left < 0 ) {
			this.setState( { forcedXAxis: 'right' } );
		} else if ( rect.right > window.innerWidth ) {
			this.setState( { forcedXAxis: 'left' } );
		}
	}

	getPositions() {
		const { position = 'top' } = this.props;
		const [ yAxis, xAxis = 'center' ] = position.split( ' ' );
		const { forcedYAxis, forcedXAxis } = this.state;

		return [
			forcedYAxis || yAxis,
			forcedXAxis || xAxis,
		];
	}

	bindNode( name ) {
		return ( node ) => this.nodes[ name ] = node;
	}

	render() {
		const { isOpen, onClose, children, className } = this.props;
		const [ yAxis, xAxis ] = this.getPositions();

		if ( ! isOpen ) {
			return null;
		}

		const eventHandlers = pickBy( this.props, ( value, key ) => (
			'onClose' !== key && REGEXP_EVENT_PROP.test( key )
		) );

		const classes = classnames(
			'components-popover',
			className,
			'is-' + yAxis,
			'is-' + xAxis,
		);

		return (
			<span ref={ this.bindNode( 'anchor' ) }>
				{ createPortal(
					<PopoverDetectOutside onClickOutside={ onClose }>
						<div
							ref={ this.bindNode( 'popover' ) }
							className={ classes }
							tabIndex="0"
							{ ...eventHandlers }
						>
							<div
								ref={ this.bindNode( 'content' ) }
								className="components-popover__content"
							>
								{ children }
							</div>
						</div>
					</PopoverDetectOutside>,
					document.body
				) }
			</span>
		);
	}
}

export default Popover;
