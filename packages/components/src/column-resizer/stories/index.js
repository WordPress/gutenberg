/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import {
	useState,
	useRef,
	useEffect,
	useCallback,
	createContext,
	useContext,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import ResizableBox from '../../resizable-box';
import { color } from '../../utils/style-mixins';

export default { title: 'Components/ColumnResizer' };

const GRID_SIZE = 12;

const ColumnResizerContext = createContext( { isGrid: true } );
const useColumnResizerContext = () => useContext( ColumnResizerContext );

const useColumnResizerContextAsItem = () => {
	const context = useColumnResizerContext();
	const id = useInstanceId( ColumnResizerProvider, 'column' );

	return { ...context, id, 'data-column-resizer': true };
};

function ColumnResizerProvider( {
	children,
	isGrid,
	onChange = noop,
	widths: widthsProp = [],
} ) {
	const [ widths, setWidths ] = useState( widthsProp );
	const containerRef = useRef();

	const [ grid, setGrid ] = useState( [ 1, 1 ] );
	const [ gridSteps, setGridSteps ] = useState(
		getGridWidths( { ref: containerRef } )
	);
	const updateGridSteps = useCallback( () => {
		setGridSteps( getGridWidths( { ref: containerRef } ) );
	}, [] );

	useEffect( () => {
		updateGridSteps();
	}, [] );

	useEffect( () => {
		window.addEventListener( 'resize', updateGridSteps );
		return () => {
			window.removeEventListener( 'resize', updateGridSteps );
		};
	}, [] );

	const handleOnChange = ( width, eventProps ) => {
		const nextWidths = [ ...widths ];

		const containerNode = containerRef.current;
		const nodes = containerNode.querySelectorAll( '[data-column-resizer]' );
		const currentNode = containerNode.querySelector(
			`#${ eventProps.id }`
		);

		const currentIndex = [ ...nodes ].indexOf( currentNode );
		nextWidths[ currentIndex ] = width;

		onChange( nextWidths );
		setWidths( nextWidths );
	};

	const [ gridStep ] = gridSteps;

	const contextValue = {
		gridSteps,
		gridStep,
		isGrid,
		grid,
		setGrid,
		onChange: handleOnChange,
	};

	return (
		<ColumnResizerContext.Provider value={ contextValue }>
			<ContainerView ref={ containerRef }>{ children }</ContainerView>
		</ColumnResizerContext.Provider>
	);
}

function ResizableBoxWrapper( props ) {
	const {
		changeValue,
		children,
		onResizeStart = noop,
		onResizeStop = noop,
		onResize = noop,
		size = {},
		isLast,
		...otherProps
	} = props;
	const {
		isGrid,
		onChange,
		id,
		gridSteps = [],
		gridStep,
		grid,
		setGrid,
		...contextProps
	} = useColumnResizerContextAsItem();
	const resizableRef = useRef();

	const [ width, setWidth ] = useState( props?.size?.width );
	const [ tempWidth, setTempWidth ] = useState( 0 );

	useEffect( () => {
		if ( size.width ) {
			setWidth( size.width );
		}
	}, [ size.width ] );

	const enable = {
		top: false,
		right: false,
		bottom: false,
		left: false,
		topRight: false,
		bottomRight: false,
		bottomLeft: false,
		topLeft: false,
		...props?.enable,
	};
	const style = {
		...props?.style,
		flex: width === undefined || isLast ? 1 : null,
	};

	const handleOnResize = ( event, direction, node, delta ) => {
		const { shiftKey } = event;
		const dw = delta.width;
		const nextWidth = Math.round( tempWidth + dw );

		if ( isGrid ) {
			setGrid( [ gridStep, 1 ] );
		} else {
			setGrid( [ shiftKey ? 10 : 1, 1 ] );
		}

		onResize( event, direction, node, delta );

		if ( nextWidth !== width ) {
			let onChangeWidth = nextWidth;

			const data = {
				gridSteps,
				width: nextWidth,
			};

			if ( isGrid ) {
				const column = getColumnValue( {
					gridSteps,
					width: nextWidth,
				} );

				data.column = column;

				onChangeWidth = getGridWidthValue( {
					gridSteps,
					width: nextWidth,
				} );
			}

			if ( ! onChange ) {
				setWidth( nextWidth );
			} else {
				onChange( onChangeWidth, { event, id, ...data } );
			}
		}
	};

	const handleOnResizeStop = ( ...args ) => {
		setTempWidth( 0 );
		onResizeStop( ...args );
	};

	const resizableGrid = grid;

	return (
		<ResizableBox
			{ ...contextProps }
			{ ...otherProps }
			id={ id }
			ref={ resizableRef }
			enable={ enable }
			style={ style }
			size={ { width } }
			onResizeStart={ ( event, direction, element, delta ) => {
				const currentWidth = element.getBoundingClientRect().width;
				setTempWidth( currentWidth );
				onResizeStart( event, direction, element, delta );
			} }
			onResizeStop={ handleOnResizeStop }
			onResize={ handleOnResize }
			grid={ resizableGrid }
			minWidth="8.3334%"
			maxWidth="91.6667%"
		>
			<ResizableVisualizer
				changeValue={ changeValue }
				width={ width }
				gridSteps={ gridSteps }
				isGrid={ isGrid }
			/>
			{ children }
		</ResizableBox>
	);
}

function ResizableVisualizer( { changeValue, isGrid, gridSteps = [] } ) {
	const nodeRef = useRef();
	const { isActive } = useDebouncedAnimation( changeValue );

	const getWidthLabel = () => {
		const width = nodeRef?.current?.clientWidth;
		if ( ! width ) return;

		return isGrid
			? getGridWidthValue( {
					gridSteps,
					width,
			  } )
			: Math.round( width );
	};

	const [ widthLabel, setWidthLabel ] = useState();

	useEffect( () => {
		setWidthLabel( getWidthLabel() );
	}, [ changeValue ] );

	return (
		<VisualizerView ref={ nodeRef } isActive={ isActive }>
			<VizLabelView>{ widthLabel }</VizLabelView>
		</VisualizerView>
	);
}

export const _default = () => {
	const [ isGrid, setIsGrid ] = useState( true );
	const [ changeValue, setChangeValue ] = useState( 0 );
	const [ columnWidths, setColumnWidths ] = useState( [
		'25%',
		'50%',
		'25%',
	] );

	const handleOnChange = ( nextValue ) => {
		setColumnWidths( nextValue );
		setChangeValue( changeValue + 1 );
	};

	return (
		<>
			<button onClick={ () => setIsGrid( ! isGrid ) }>
				Grid ({ isGrid ? 'ON' : 'OFF' })
			</button>
			<hr />
			<br />
			<br />
			<br />
			<br />
			<ColumnResizerProvider
				isGrid={ isGrid }
				widths={ columnWidths }
				onChange={ handleOnChange }
			>
				<ResizableBoxWrapper
					changeValue={ changeValue }
					size={ { width: columnWidths[ 0 ] } }
					enable={ {
						right: true,
					} }
				>
					<BoxView />
				</ResizableBoxWrapper>
				<ResizableBoxWrapper
					changeValue={ changeValue }
					size={ { width: columnWidths[ 1 ] } }
					enable={ {
						right: true,
					} }
				>
					<BoxView />
				</ResizableBoxWrapper>
				<ResizableBoxWrapper
					changeValue={ changeValue }
					size={ { width: columnWidths[ 2 ] } }
					isLast
				>
					<BoxView />
				</ResizableBoxWrapper>
			</ColumnResizerProvider>
		</>
	);
};

const ContainerView = styled.div`
	display: flex;
`;

const BoxView = styled.div`
	background: #eee;
	padding: 20px;
	border: 2px solid #ccc;
`;

const VisualizerView = styled.div`
	position: absolute;
	filter: brightness( 2 );
	border: 1px solid ${color( 'ui.brand' )};
	border-bottom: none;
	top: -7px;
	left: 1px;
	right: 1px;
	pointer-events: none;
	opacity: 0;
	height: 5px;
	pointer-events: none;
	transition: opacity 120ms linear;
	z-index: 10;

	${( { isActive } ) =>
		isActive &&
		`
		opacity: 1;
	`}
`;

const VizLabelView = styled.div`
	text-align: center;
	color: ${color( 'ui.brand' )};
	font-size: 11px;
	top: -15px;
	position: relative;
`;

function getContainerNode( { ref } ) {
	const containerNode = ref?.current;

	return containerNode;
}

function getContainerNodeWidth( { ref } ) {
	const containerNode = getContainerNode( { ref } );
	const containerWidth = containerNode.getBoundingClientRect().width;

	return containerWidth;
}

function getGridWidths( { ref } ) {
	if ( ! ref || ! ref.current ) {
		return [];
	}
	const containerWidth = getContainerNodeWidth( { ref } );

	const gridWidths = [ ...Array( GRID_SIZE ).keys() ].map(
		( v ) => ( ( v + 1 ) / GRID_SIZE ) * containerWidth
	);

	return gridWidths;
}

function getNearestValue( values = [], value = 0 ) {
	return values.reduce( ( prev, curr ) => {
		return Math.abs( curr - value ) < Math.abs( prev - value )
			? curr
			: prev;
	}, [] );
}

function getColumnValue( { gridSteps, width } ) {
	const columnValue = getNearestValue( gridSteps, width );
	return gridSteps.indexOf( columnValue ) + 1;
}

function getGridWidthValue( { gridSteps, width } ) {
	const columnValue = getColumnValue( { gridSteps, width } );

	let widthValue = ( columnValue / GRID_SIZE ) * 100;
	widthValue = `${ widthValue.toFixed( 2 ) }%`;

	return widthValue;
}

/**
 * Custom hook that renders the "flash" animation whenever the value changes.
 *
 * @param {string} value Value of (box) side.
 */
function useDebouncedAnimation( value ) {
	const [ isActive, setIsActive ] = useState( false );
	const valueRef = useRef( value );
	const timeoutRef = useRef();

	const clearTimer = () => {
		if ( timeoutRef.current ) {
			window.clearTimeout( timeoutRef.current );
		}
	};

	useEffect( () => {
		if ( value !== valueRef.current ) {
			setIsActive( true );
			valueRef.current = value;

			clearTimer();

			timeoutRef.current = setTimeout( () => {
				setIsActive( false );
			}, 800 );
		}

		return () => clearTimer();
	}, [ value ] );

	return {
		isActive,
	};
}
