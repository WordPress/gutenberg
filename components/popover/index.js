/**
 * External dependencies
 */
import classnames from 'classnames';
import { isEqual, includes } from 'lodash';

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
			forcedPositions: {},
		};
	}

	componentDidMount() {
		this.setForcedPositions();
	}

	componentWillReceiveProps( nextProps ) {
		if ( this.props.position !== nextProps.position ) {
			this.setState( { forcedPositions: {} } );
		}
	}

	componentDidUpdate( prevProps ) {
		if ( this.props.position !== prevProps.position ) {
			this.setForcedPositions();
		}
	}

	setForcedPositions() {
		const rect = this.node.getBoundingClientRect();
		const { forcedPositions } = this.state;

		const nextForcedPositions = {};

		// Check exceeding top or bottom of viewport
		if ( rect.top < 0 ) {
			nextForcedPositions.bottom = true;
		} else if ( rect.bottom > window.innerHeight ) {
			nextForcedPositions.top = true;
		}

		// Check exceeding left or right of viewport
		if ( rect.left < 0 ) {
			nextForcedPositions.right = true;
		} else if ( rect.right > window.innerWidth ) {
			nextForcedPositions.left = true;
		}

		if ( ! isEqual( nextForcedPositions, forcedPositions ) ) {
			this.setState( {
				forcedPositions: nextForcedPositions,
			} );
		}
	}

	bindNode( node ) {
		this.node = node;
	}

	render() {
		const { position, children, className } = this.props;
		const positions = position.split( ' ' );
		const { forcedPositions } = this.state;

		const classes = classnames(
			'components-popover',
			className,
			...[ [ 'top', 'bottom' ], [ 'center', 'left', 'right' ] ].map( ( directions ) => {
				// Consider first of directions set as the default
				const defaultDirection = directions[ 0 ];

				// Prefer the forced direction, but allow direction from props
				// otherwise. Use default if neither forced nor prop value.
				const direction = directions.reduce( ( result, dir ) => (
					forcedPositions[ dir ] || ( ! result && includes( positions, dir ) )
						? dir
						: result
				), null ) || defaultDirection;

				return 'is-' + direction;
			} )
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
