/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, createRef } from '@wordpress/element';
import { withInstanceId, compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BaseControl from '../base-control';
import withFocusOutside from '../higher-order/with-focus-outside';
import { Path, SVG } from '../primitives';

const TEXTCONTROL_MIN = 0;
const TEXTCONTROL_MAX = 100;

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
		this.imageRef = createRef();
		this.horizontalPositionChanged = this.horizontalPositionChanged.bind( this );
		this.verticalPositionChanged = this.verticalPositionChanged.bind( this );
		this.onLoad = this.onLoad.bind( this );
	}
	componentDidUpdate( prevProps ) {
		if ( prevProps.url !== this.props.url ) {
			this.setState( {
				isDragging: false,
			} );
		}
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
		if ( ! this.imageRef.current ) {
			return bounds;
		}
		const dimensions = {
			width: this.imageRef.current.clientWidth,
			height: this.imageRef.current.clientHeight,
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
	onLoad() {
		this.setState( {
			bounds: this.calculateBounds(),
		} );
	}
	onMouseMove( event ) {
		const { isDragging, bounds } = this.state;
		const { onChange } = this.props;

		if ( isDragging ) {
			const pickerDimensions = this.pickerDimensions();
			const cursorPosition = {
				left: event.pageX - pickerDimensions.left,
				top: event.pageY - pickerDimensions.top,
			};
			const left = Math.max(
				bounds.left,
				Math.min(
					cursorPosition.left, bounds.right
				)
			);
			const top = Math.max(
				bounds.top,
				Math.min(
					cursorPosition.top, bounds.bottom
				)
			);
			const percentages = {
				x: ( ( left - bounds.left ) / ( pickerDimensions.width - ( bounds.left * 2 ) ) ).toFixed( 2 ),
				y: ( ( top - bounds.top ) / ( pickerDimensions.height - ( bounds.top * 2 ) ) ).toFixed( 2 ),
			};
			this.setState( { percentages }, function() {
				onChange( {
					x: this.state.percentages.x,
					y: this.state.percentages.y,
				} );
			} );
		}
	}
	fractionToPercentage( fraction ) {
		return Math.round( fraction * 100 );
	}
	horizontalPositionChanged( event ) {
		this.positionChangeFromTextControl( 'x', event.target.value );
	}
	verticalPositionChanged( event ) {
		this.positionChangeFromTextControl( 'y', event.target.value );
	}
	positionChangeFromTextControl( axis, value ) {
		const { onChange } = this.props;
		const { percentages } = this.state;
		const cleanValue = Math.max( Math.min( parseInt( value ), 100 ), 0 );
		percentages[ axis ] = ( cleanValue ? cleanValue / 100 : 0 ).toFixed( 2 );
		this.setState( { percentages }, function() {
			onChange( {
				x: this.state.percentages.x,
				y: this.state.percentages.y,
			} );
		} );
	}
	pickerDimensions() {
		if ( this.containerRef.current ) {
			return {
				width: this.containerRef.current.clientWidth,
				height: this.containerRef.current.clientHeight,
				top: this.containerRef.current.getBoundingClientRect().top + document.body.scrollTop,
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
		const { instanceId, url, value, label, help, className } = this.props;
		const { bounds, isDragging, percentages } = this.state;
		const pickerDimensions = this.pickerDimensions();
		const iconCoordinates = {
			left: ( value.x * ( pickerDimensions.width - ( bounds.left * 2 ) ) ) + bounds.left,
			top: ( value.y * ( pickerDimensions.height - ( bounds.top * 2 ) ) ) + bounds.top,
		};
		const iconContainerStyle = {
			left: `${ iconCoordinates.left }px`,
			top: `${ iconCoordinates.top }px`,
		};
		const iconContainerClasses = classnames(
			'components-focal-point-picker__icon_container',
			isDragging ? 'is-dragging' : null
		);
		const id = `inspector-focal-point-picker-control-${ instanceId }`;
		const horizontalPositionId = `inspector-focal-point-picker-control-horizontal-position-${ instanceId }`;
		const verticalPositionId = `inspector-focal-point-picker-control-vertical-position-${ instanceId }`;
		return (
			<BaseControl label={ label } id={ id } help={ help } className={ className }>
				<div className="components-focal-point-picker-wrapper">
					<div
						className="components-focal-point-picker"
						onMouseDown={ () => this.setState( { isDragging: true } ) }
						onDragStart={ () => this.setState( { isDragging: true } ) }
						onMouseUp={ () => this.setState( { isDragging: false } ) }
						onDrop={ () => this.setState( { isDragging: false } ) }
						onMouseMove={ this.onMouseMove }
						ref={ this.containerRef }
						role="button"
						tabIndex="-1"
					>
						<img
							alt="Dimensions helper"
							onLoad={ this.onLoad }
							ref={ this.imageRef }
							src={ url }
							draggable="false"
						/>
						<div className={ iconContainerClasses } style={ iconContainerStyle }>
							<SVG className="components-focal-point-picker__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30">
								<Path className="components-focal-point-picker__icon-outline" d="M15 1C7.3 1 1 7.3 1 15s6.3 14 14 14 14-6.3 14-14S22.7 1 15 1zm0 22c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z" />
								<Path className="components-focal-point-picker__icon-fill" d="M15 3C8.4 3 3 8.4 3 15s5.4 12 12 12 12-5.4 12-12S21.6 3 15 3zm0 22C9.5 25 5 20.5 5 15S9.5 5 15 5s10 4.5 10 10-4.5 10-10 10z" />
							</SVG>
						</div>
					</div>
				</div>
				<div className="components-focal-point-picker_position-display-container">
					<BaseControl label={ __( 'Horizontal Pos.' ) } id={ horizontalPositionId }>
						<input
							className="components-text-control__input"
							id={ horizontalPositionId }
							max={ TEXTCONTROL_MAX }
							min={ TEXTCONTROL_MIN }
							onChange={ this.horizontalPositionChanged }
							type="number"
							value={ this.fractionToPercentage( percentages.x ) }
						/>
						<span>%</span>
					</BaseControl>
					<BaseControl label={ __( 'Vertical Pos.' ) } id={ verticalPositionId }>
						<input
							className="components-text-control__input"
							id={ verticalPositionId }
							max={ TEXTCONTROL_MAX }
							min={ TEXTCONTROL_MIN }
							onChange={ this.verticalPositionChanged }
							type="number"
							value={ this.fractionToPercentage( percentages.y ) }
						/>
						<span>%</span>
					</BaseControl>
				</div>
			</BaseControl>
		);
	}
}

FocalPointPicker.defaultProps = {
	url: null,
	value: {
		x: 0.5,
		y: 0.5,
	},
	onChange: () => {},
};

export default compose( [ withInstanceId, withFocusOutside ] )( FocalPointPicker );
