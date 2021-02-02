/**
 * External dependencies
 */
import { noop } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, createRef } from '@wordpress/element';
import { withInstanceId, compose } from '@wordpress/compose';
import { UP, DOWN, LEFT, RIGHT } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import withFocusOutside from '../higher-order/with-focus-outside';
import BaseControl from '../base-control';
import Controls from './controls';
import FocalPoint from './focal-point';
import Grid from './grid';
import Media from './media';
import {
	MediaWrapper,
	MediaContainer,
} from './styles/focal-point-picker-style';
import { roundClamp } from '../utils/math';
import { INITIAL_BOUNDS } from './utils';

export class FocalPointPicker extends Component {
	constructor( props ) {
		super( ...arguments );

		this.state = {
			isDragging: false,
			bounds: INITIAL_BOUNDS,
			percentages: props.value,
		};

		this.containerRef = createRef();
		this.mediaRef = createRef();

		this.handleOnClick = this.handleOnClick.bind( this );
		this.handleOnMouseUp = this.handleOnMouseUp.bind( this );
		this.handleOnKeyDown = this.handleOnKeyDown.bind( this );
		this.onMouseMove = this.onMouseMove.bind( this );

		this.updateBounds = this.updateBounds.bind( this );
		this.updateValue = this.updateValue.bind( this );
	}
	componentDidMount() {
		document.addEventListener( 'mouseup', this.handleOnMouseUp );
		window.addEventListener( 'resize', this.updateBounds );

		/*
		 * Set initial bound values.
		 *
		 * This is necessary for Safari:
		 * https://github.com/WordPress/gutenberg/issues/25814
		 */
		this.updateBounds();
	}
	componentDidUpdate( prevProps ) {
		if ( prevProps.url !== this.props.url ) {
			this.setState( {
				isDragging: false,
			} );
		}
		/*
		 * Handles cases where the incoming value changes.
		 * An example is the values resetting based on an UNDO action.
		 */
		if (
			this.props.value.x !== this.state.percentages.x ||
			this.props.value.y !== this.state.percentages.y
		) {
			this.setState( { percentages: this.props.value } );
		}
	}
	componentWillUnmount() {
		document.removeEventListener( 'mouseup', this.handleOnMouseUp );
		window.removeEventListener( 'resize', this.updateBounds );
	}
	calculateBounds() {
		const bounds = INITIAL_BOUNDS;

		if ( ! this.mediaRef.current ) {
			return bounds;
		}

		// Prevent division by zero when updateBounds runs in componentDidMount
		if (
			this.mediaRef.current.clientWidth === 0 ||
			this.mediaRef.current.clientHeight === 0
		) {
			return bounds;
		}

		const dimensions = {
			width: this.mediaRef.current.clientWidth,
			height: this.mediaRef.current.clientHeight,
		};

		const pickerDimensions = this.pickerDimensions();

		const widthRatio = pickerDimensions.width / dimensions.width;
		const heightRatio = pickerDimensions.height / dimensions.height;

		if ( heightRatio >= widthRatio ) {
			bounds.width = bounds.right = pickerDimensions.width;
			bounds.height = dimensions.height * widthRatio;
			bounds.top = ( pickerDimensions.height - bounds.height ) / 2;
			bounds.bottom = bounds.top + bounds.height;
		} else {
			bounds.height = bounds.bottom = pickerDimensions.height;
			bounds.width = dimensions.width * heightRatio;
			bounds.left = ( pickerDimensions.width - bounds.width ) / 2;
			bounds.right = bounds.left + bounds.width;
		}
		return bounds;
	}
	updateValue( nextValue = {} ) {
		const { onChange } = this.props;
		const { x, y } = nextValue;

		const nextPercentage = {
			x: parseFloat( x ).toFixed( 2 ),
			y: parseFloat( y ).toFixed( 2 ),
		};

		this.setState( { percentages: nextPercentage }, () => {
			onChange( nextPercentage );
		} );
	}
	updateBounds() {
		this.setState( {
			bounds: this.calculateBounds(),
		} );
	}
	handleOnClick( event ) {
		event.persist();
		this.setState( { isDragging: true }, () => {
			this.onMouseMove( event );
		} );
	}
	handleOnMouseUp() {
		this.setState( { isDragging: false } );
	}
	handleOnKeyDown( event ) {
		const { keyCode, shiftKey } = event;
		if ( ! [ UP, DOWN, LEFT, RIGHT ].includes( keyCode ) ) return;

		const { x, y } = this.state.percentages;

		event.preventDefault();

		// Normalizing values for incrementing/decrementing based on arrow keys
		let nextX = parseFloat( x );
		let nextY = parseFloat( y );
		const step = shiftKey ? 0.1 : 0.01;

		switch ( event.keyCode ) {
			case UP:
				nextY = nextY - step;
				break;
			case DOWN:
				nextY = nextY + step;
				break;
			case LEFT:
				nextX = nextX - step;
				break;
			case RIGHT:
				nextX = nextX + step;
				break;
		}

		nextX = roundClamp( nextX, 0, 1, step );
		nextY = roundClamp( nextY, 0, 1, step );

		const percentages = {
			x: nextX,
			y: nextY,
		};

		this.updateValue( percentages );
	}
	onMouseMove( event ) {
		const { isDragging, bounds } = this.state;

		if ( ! isDragging ) return;

		// Prevents text-selection when dragging.
		event.preventDefault();

		const { shiftKey } = event;
		const pickerDimensions = this.pickerDimensions();
		const cursorPosition = {
			left: event.pageX - pickerDimensions.left,
			top: event.pageY - pickerDimensions.top,
		};

		const left = Math.max(
			bounds.left,
			Math.min( cursorPosition.left, bounds.right )
		);
		const top = Math.max(
			bounds.top,
			Math.min( cursorPosition.top, bounds.bottom )
		);

		let nextX =
			( left - bounds.left ) /
			( pickerDimensions.width - bounds.left * 2 );
		let nextY =
			( top - bounds.top ) / ( pickerDimensions.height - bounds.top * 2 );

		// Enables holding shift to jump values by 10%
		const step = shiftKey ? 0.1 : 0.01;

		nextX = roundClamp( nextX, 0, 1, step );
		nextY = roundClamp( nextY, 0, 1, step );

		const nextPercentage = {
			x: nextX,
			y: nextY,
		};

		this.updateValue( nextPercentage );
	}
	pickerDimensions() {
		const containerNode = this.containerRef.current;

		if ( ! containerNode ) {
			return {
				width: 0,
				height: 0,
				left: 0,
				top: 0,
			};
		}

		const { clientHeight, clientWidth } = containerNode;
		const { top, left } = containerNode.getBoundingClientRect();

		return {
			width: clientWidth,
			height: clientHeight,
			top: top + document.body.scrollTop,
			left,
		};
	}
	iconCoordinates() {
		const { value } = this.props;
		const { bounds } = this.state;

		if ( bounds.left === undefined || bounds.top === undefined ) {
			return {
				left: '50%',
				top: '50%',
			};
		}

		const pickerDimensions = this.pickerDimensions();
		const iconCoordinates = {
			left:
				value.x * ( pickerDimensions.width - bounds.left * 2 ) +
				bounds.left,
			top:
				value.y * ( pickerDimensions.height - bounds.top * 2 ) +
				bounds.top,
		};

		return iconCoordinates;
	}
	// Callback method for the withFocusOutside higher-order component
	handleFocusOutside() {
		this.setState( {
			isDragging: false,
		} );
	}
	render() {
		const {
			autoPlay,
			className,
			help,
			instanceId,
			label,
			onDragStart,
			onDragEnd,
			url,
		} = this.props;
		const { bounds, isDragging, percentages } = this.state;
		const iconCoordinates = this.iconCoordinates();

		const classes = classnames(
			'components-focal-point-picker-control',
			className
		);

		const id = `inspector-focal-point-picker-control-${ instanceId }`;

		return (
			<BaseControl
				label={ label }
				id={ id }
				help={ help }
				className={ classes }
			>
				<MediaWrapper className="components-focal-point-picker-wrapper">
					<MediaContainer
						className="components-focal-point-picker"
						onDragStart={ ( event ) => {
							this.setState( { isDragging: true } );
							onDragStart( event );
						} }
						onDrop={ ( event ) => {
							this.setState( { isDragging: false } );
							onDragEnd( event );
						} }
						onKeyDown={ this.handleOnKeyDown }
						onMouseDown={ this.handleOnClick }
						onMouseMove={ this.onMouseMove }
						onMouseUp={ this.handleOnMouseUp }
						ref={ this.containerRef }
						role="button"
						tabIndex="-1"
					>
						<Grid
							bounds={ bounds }
							value={ percentages.x + percentages.y }
						/>
						<Media
							alt={ __( 'Media preview' ) }
							autoPlay={ autoPlay }
							mediaRef={ this.mediaRef }
							onLoad={ this.updateBounds }
							src={ url }
						/>
						<FocalPoint
							coordinates={ iconCoordinates }
							isDragging={ isDragging }
						/>
					</MediaContainer>
				</MediaWrapper>
				<Controls
					percentages={ percentages }
					onChange={ this.updateValue }
				/>
			</BaseControl>
		);
	}
}

FocalPointPicker.defaultProps = {
	autoPlay: true,
	onDragStart: noop,
	onDragEnd: noop,
	onChange: noop,
	value: {
		x: 0.5,
		y: 0.5,
	},
	url: null,
};

export default compose( [ withInstanceId, withFocusOutside ] )(
	FocalPointPicker
);
