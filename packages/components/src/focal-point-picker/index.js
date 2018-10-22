/**
 * External dependencies
 */

import { Component, createRef } from '@wordpress/element';
import { withInstanceId, compose } from '@wordpress/compose';
import BaseControl from '../base-control/';
import withFocusOutside from '../higher-order/with-focus-outside';
import classnames from 'classnames';

/**
 * Internal dependencies
 */

import './style.scss';

export class FocalPointPicker extends Component {
	constructor() {
		super( ...arguments );
		this.onMouseMove = this.onMouseMove.bind( this );
		this.state = {
			isDragging: false,
			bounds: {},
		};
		this.containerRef = createRef();
	}
	componentDidMount() {
		this.setState( { bounds: this.calculateBounds() } );
	}
	componentDidUpdate( prevProps ) {
		if ( prevProps.dimensions !== this.props.dimensions || prevProps.url !== this.props.url ) {
			this.setState( {
				bounds: this.calculateBounds(),
				isDragging: false,
			} );
		}
	}
	calculateBounds() {
		const { dimensions } = this.props;
		const pickerDimensions = this.pickerDimensions();
		const bounds = {
			top: 0,
			left: 0,
			bottom: 0,
			right: 0,
			width: 0,
			height: 0,
		};
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
				bounds.left, Math.min(
					cursorPosition.left, bounds.right
				)
			);
			const top = Math.max(
				bounds.top, Math.min(
					cursorPosition.top, bounds.bottom
				)
			);
			onChange( {
				x: left / pickerDimensions.width,
				y: top / pickerDimensions.height,
			} );
		}
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
	render() {
		const { instanceId, url, value, label, help, className } = this.props;
		const { isDragging } = this.state;
		const pickerDimensions = this.pickerDimensions();
		const containerStyle = { backgroundImage: `url(${ url })` };
		const iconContainerStyle = {
			left: `${ value.x * pickerDimensions.width }px`,
			top: `${ value.y * pickerDimensions.height }px`,
		};
		const iconContainerClasses = classnames(
			'component-focal-point-picker__icon_container',
			isDragging ? 'is-dragging' : null
		);
		const id = `inspector-focal-point-picker-control-${ instanceId }`;
		return (
			<BaseControl label={ label } id={ id } help={ help } className={ className }>
				<div
					className="component-focal-point-picker"
					style={ containerStyle }
					onMouseDown={ () => this.setState( { isDragging: true } ) }
					onDragStart={ () => this.setState( { isDragging: true } ) }
					onMouseUp={ () => this.setState( { isDragging: false } ) }
					onDrop={ () => this.setState( { isDragging: false } ) }
					onMouseMove={ this.onMouseMove }
					ref={ this.containerRef }
					role="button"
					tabIndex="0"
				>
					<div className={ iconContainerClasses } style={ iconContainerStyle }>
						<i className="component-focal-point-picker__icon"></i>
					</div>
				</div>
			</BaseControl>
		);
	}
	handleFocusOutside() {
		this.setState( {
			isDragging: false,
		} );
	}
}

FocalPointPicker.defaultProps = {
	url: null,
	dimensions: {
		height: 0,
		width: 0,
	},
	value: {
		x: 0.5,
		y: 0.5,
	},
	onChange: () => {},
};

export default compose( [
	withInstanceId,
	withFocusOutside,
] )( FocalPointPicker );

