/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
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
import { roundClamp } from '../number-control/utils';

export class FocalPointPicker extends Component {
	constructor( props ) {
		super( props );
		this.onMouseMove = this.onMouseMove.bind( this );
		this.state = {
			isDragging: false,
			bounds: {},
			percentages: props.value,
		};
		this.containerRef = createRef();
		this.mediaRef = createRef();
		this.horizontalPositionChanged = this.horizontalPositionChanged.bind(
			this
		);
		this.verticalPositionChanged = this.verticalPositionChanged.bind(
			this
		);
		this.onLoad = this.onLoad.bind( this );
		this.handleOnMouseUp = this.handleOnMouseUp.bind( this );
		this.handleOnKeyDown = this.handleOnKeyDown.bind( this );
		this.updateBounds = this.updateBounds.bind( this );
	}
	componentDidMount() {
		document.addEventListener( 'mouseup', this.handleOnMouseUp );
		window.addEventListener( 'resize', this.updateBounds );
	}
	componentDidUpdate( prevProps ) {
		if ( prevProps.url !== this.props.url ) {
			this.setState( {
				isDragging: false,
			} );
		}
	}
	componentWillUnmount() {
		document.removeEventListener( 'mouseup', this.handleOnMouseUp );
		window.removeEventListener( 'resize', this.updateBounds );
	}
	calculateBounds() {
		const bounds = {
			top: 0,
			left: 0,
			bottom: 0,
			right: 0,
			width: 0,
			height: 0,
		};

		if ( ! this.mediaRef.current ) {
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
	updateValue( nextValue ) {
		const { onChange } = this.props;

		this.setState( { percentages: nextValue }, () => {
			onChange( nextValue );
		} );
	}
	updateBounds() {
		this.setState( {
			bounds: this.calculateBounds(),
		} );
	}
	onLoad() {
		this.updateBounds();
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
		let nextX = parseFloat( x ) * 100;
		let nextY = parseFloat( y ) * 100;
		const step = shiftKey ? 10 : 1;

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

		// Transforming values back to 0.00 percentage values
		nextX = ( roundClamp( nextX, 0, 100, step ) / 100 ).toFixed( 2 );
		nextY = ( roundClamp( nextY, 0, 100, step ) / 100 ).toFixed( 2 );

		const percentages = {
			x: nextX,
			y: nextY,
		};

		this.updateValue( percentages );
	}
	onMouseMove( event ) {
		const { isDragging, bounds } = this.state;

		if ( ! isDragging ) return;

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

		const percentages = {
			x: (
				( left - bounds.left ) /
				( pickerDimensions.width - bounds.left * 2 )
			).toFixed( 2 ),
			y: (
				( top - bounds.top ) /
				( pickerDimensions.height - bounds.top * 2 )
			).toFixed( 2 ),
		};

		this.updateValue( percentages );
	}
	horizontalPositionChanged( nextValue ) {
		this.positionChangeFromTextControl( 'x', nextValue );
	}
	verticalPositionChanged( nextValue ) {
		this.positionChangeFromTextControl( 'y', nextValue );
	}
	positionChangeFromTextControl( axis, value ) {
		const { percentages } = this.state;

		const cleanValue = Math.max( Math.min( parseInt( value ), 100 ), 0 );
		percentages[ axis ] = ( cleanValue ? cleanValue / 100 : 0 ).toFixed(
			2
		);

		this.updateValue( percentages );
	}
	pickerDimensions() {
		if ( this.containerRef.current ) {
			return {
				width: this.containerRef.current.clientWidth,
				height: this.containerRef.current.clientHeight,
				top:
					this.containerRef.current.getBoundingClientRect().top +
					document.body.scrollTop,
				left: this.containerRef.current.getBoundingClientRect().left,
			};
		}
		return {
			width: 0,
			height: 0,
			left: 0,
			top: 0,
		};
	}
	handleFocusOutside() {
		this.setState( {
			isDragging: false,
		} );
	}
	render() {
		const {
			autoPlay,
			instanceId,
			url,
			value,
			label,
			help,
			className,
		} = this.props;
		const { bounds, isDragging, percentages } = this.state;
		const pickerDimensions = this.pickerDimensions();
		const iconCoordinates = {
			left:
				value.x * ( pickerDimensions.width - bounds.left * 2 ) +
				bounds.left,
			top:
				value.y * ( pickerDimensions.height - bounds.top * 2 ) +
				bounds.top,
		};

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
						onMouseDown={ ( event ) => {
							event.persist();
							this.setState( { isDragging: true }, () => {
								this.onMouseMove( event );
							} );
						} }
						onDragStart={ () =>
							this.setState( { isDragging: true } )
						}
						onMouseUp={ this.handleOnMouseUp }
						onDrop={ () => this.setState( { isDragging: false } ) }
						onMouseMove={ this.onMouseMove }
						ref={ this.containerRef }
						role="button"
						tabIndex="-1"
						onKeyDown={ this.handleOnKeyDown }
					>
						<Grid
							percentages={ percentages }
							style={ {
								width: bounds.width,
								height: bounds.height,
							} }
						/>
						<Media
							alt="Dimensions helper"
							autoPlay={ autoPlay }
							mediaRef={ this.mediaRef }
							onLoad={ this.onLoad }
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
					onHorizontalChange={ this.horizontalPositionChanged }
					onVerticalChange={ this.verticalPositionChanged }
				/>
			</BaseControl>
		);
	}
}

FocalPointPicker.defaultProps = {
	autoPlay: true,
	url: null,
	value: {
		x: 0.5,
		y: 0.5,
	},
	onChange: () => {},
};

export default compose( [ withInstanceId, withFocusOutside ] )(
	FocalPointPicker
);
