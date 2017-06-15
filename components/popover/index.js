/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component } from 'element';

/**
 * Internal dependencies
 */
import './style.scss';

class Popover extends Component {
	constructor() {
		super( ...arguments );

		this.bindNode = this.bindNode.bind( this );

		this.state = {
			forcedYAxis: null,
			forcedXAxis: null,
		};
	}

	componentDidMount() {
		this.setForcedPositions();
	}

	componentWillReceiveProps( nextProps ) {
		if ( this.props.position !== nextProps.position ) {
			this.setState( {
				forcedYAxis: null,
				forcedXAxis: null,
			} );
		}
	}

	componentDidUpdate( prevProps ) {
		if ( this.props.position !== prevProps.position ) {
			this.setForcedPositions();
		}
	}

	setForcedPositions() {
		const rect = this.node.getBoundingClientRect();

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

	bindNode( node ) {
		this.node = node;
	}

	render() {
		const { position, children, className } = this.props;
		const { forcedYAxis, forcedXAxis } = this.state;
		const [ yAxis = 'top', xAxis = 'center' ] = position.split( ' ' );

		const classes = classnames(
			'components-popover',
			className,
			'is-' + ( forcedYAxis || yAxis ),
			'is-' + ( forcedXAxis || xAxis )
		);

		return (
			<div
				ref={ this.bindNode }
				className={ classes }
				tabIndex="0">
				{ children }
			</div>
		);
	}
}

export default Popover;
