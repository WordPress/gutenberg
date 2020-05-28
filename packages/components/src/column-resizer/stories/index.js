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
import RangeControl from '../../range-control';
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
	const [ changeValue, setChangeValue ] = useState( 0 );
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
		const containerNode = containerRef.current;
		const nodes = [
			...containerNode.querySelectorAll( '[data-column-resizer]' ),
		];
		const currentNode = containerNode.querySelector(
			`#${ eventProps.id }`
		);

		const renderColumnWidths = () => {
			return nodes
				.map( ( node ) => {
					const w = node.clientWidth;
					return getGridWidthValue( { gridSteps, width: w } );
				} )
				.forEach( ( w, index ) => {
					nodes[ index ].style.width = w;
				} );
		};

		currentNode.style.width = width;

		if ( isGrid ) {
			renderColumnWidths();
		}

		const nextWidths = nodes.map( ( node ) => node.clientWidth );

		onChange( nextWidths );
		setWidths( nextWidths );
		setChangeValue( changeValue + 1 );
	};

	const [ gridStep ] = gridSteps;

	const contextValue = {
		gridSteps,
		gridStep,
		isGrid,
		grid,
		widths,
		setGrid,
		onChange: handleOnChange,
		changeValue,
	};

	return (
		<ColumnResizerContext.Provider value={ contextValue }>
			<ContainerView ref={ containerRef }>
				<ColumnGridVisualizer />
				{ children }
			</ContainerView>
		</ColumnResizerContext.Provider>
	);
}

function ColumnGridVisualizer( { gap } ) {
	const { changeValue, isGrid } = useColumnResizerContext();
	const { isActive } = useDebouncedAnimation( changeValue );

	if ( ! isGrid ) return null;

	return (
		<VisualizerGridView isActive={ isActive } style={ { gridGap: gap } }>
			<VisualizerGridColumnView />
			<VisualizerGridColumnView />
			<VisualizerGridColumnView />
			<VisualizerGridColumnView />
			<VisualizerGridColumnView />
			<VisualizerGridColumnView />
			<VisualizerGridColumnView />
			<VisualizerGridColumnView />
			<VisualizerGridColumnView />
			<VisualizerGridColumnView />
			<VisualizerGridColumnView />
			<VisualizerGridColumnView />
		</VisualizerGridView>
	);
}

function ResizableBoxWrapper( props ) {
	const {
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
		let nextWidth = Math.round( tempWidth + dw );

		onResize( event, direction, node, delta );

		if ( isGrid ) {
			setGrid( [ gridStep, 1 ] );
		} else {
			setGrid( [ shiftKey ? 10 : 1, 1 ] );
		}

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

			nextWidth = getGridWidthValue( {
				gridSteps,
				width: nextWidth,
			} );
		}

		if ( nextWidth !== width ) {
			setWidth( nextWidth );
			onChange( nextWidth, { event, id, ...data } );
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
			<ResizableVisualizer />
			{ children }
		</ResizableBox>
	);
}

function ResizableVisualizer() {
	const nodeRef = useRef();
	const { changeValue, gridSteps, isGrid } = useColumnResizerContext();
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
			<VisualizerLabelView>{ widthLabel }</VisualizerLabelView>
		</VisualizerView>
	);
}

export const _default = () => {
	const [ isGrid, setIsGrid ] = useState( true );
	const [ columnWidths, setColumnWidths ] = useState( [
		'25%',
		'50%',
		'25%',
	] );

	const handleOnChange = ( nextValue ) => {
		setColumnWidths( nextValue );
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
					size={ { width: columnWidths[ 0 ] } }
					enable={ {
						right: true,
					} }
				>
					<BoxView />
				</ResizableBoxWrapper>
				<ResizableBoxWrapper
					size={ { width: columnWidths[ 1 ] } }
					enable={ {
						right: true,
					} }
				>
					<BoxView />
				</ResizableBoxWrapper>
				<ResizableBoxWrapper
					size={ { width: columnWidths[ 2 ] } }
					isLast
				>
					<BoxView />
				</ResizableBoxWrapper>
			</ColumnResizerProvider>
		</>
	);
};

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

const CSSGridContainerView = styled.div`
	width: 100%;
	position: relative;
`;

const ContainerView = styled.div`
	display: flex;
	position: relative;
`;

const BoxView = styled.div`
	background: #eee;
	padding: 20px;
	border: 2px solid #ccc;
	height: 200px;
`;

const VisualizerView = styled.div`
	position: absolute;
	filter: brightness( 2 );
	border: 1px solid ${color( 'ui.brand' )};
	border-bottom: none;
	top: -7px;
	left: 1px;
	right: 1px;
	opacity: 0;
	height: 5px;
	pointer-events: none;
	transition: opacity 120ms linear;
	z-index: 1000;

	${( { isActive } ) =>
		isActive &&
		`
		opacity: 1;
	`}
`;

const VisualizerLabelView = styled.div`
	text-align: center;
	color: ${color( 'ui.brand' )};
	font-size: 11px;
	top: -15px;
	position: relative;
`;

const VisualizerGridView = styled.div`
	display: grid;
	position: absolute;
	grid-template-columns: repeat( 12, 1fr );
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
	opacity: 0;
	pointer-events: none;
	transition: opacity 100ms linear;
	z-index: 1000;

	${( { isActive } ) =>
		isActive &&
		`
		opacity: 1;
	`}
`;

const VisualizerGridColumnView = styled.div`
	box-sizing: border-box;
	border-left: 1px dashed ${color( 'ui.brand' )};
	border-right: 1px dashed ${color( 'ui.brand' )};
	height: 100%;
	pointer-events: none;
	opacity: 0.3;
	filter: brightness( 0.5 );
`;

/**
 * Trying it out using CSS Grid
 */

const GridTestView = styled.div`
	--gridColumn1Width: 1fr;
	--gridColumn2Width: 1fr;
	--gridColumn3Width: 1fr;
	--gridColumn4Width: 1fr;
	--gridColumn5Width: 1fr;
	--gridColumn6Width: 1fr;
	--gridGap: 0;
	--gridTemplateColumns: var( --gridColumn1Width ) var( --gridColumn2Width )
		var( --gridColumn3Width );

	box-sizing: border-box;
	display: grid;
	grid-template-columns: var( --gridTemplateColumns );
	grid-gap: var( --gridGap );
`;

const CSSGridExample = () => {
	const [ isGrid, setIsGrid ] = useState( true );
	const [ gap, setGap ] = useState( 0 );

	const ghostNode = useRef();
	const containerNode = useRef();
	const [ changeValue, setChangeValue ] = useState( 0 );
	const [ columnWidths, setColumnWidths ] = useState( [
		'25%',
		'25%',
		'25%',
		'25%',
	] );

	const [ grid, setGrid ] = useState( [ 1, 1 ] );
	const [ gridSteps, setGridSteps ] = useState(
		getGridWidths( { ref: containerNode } )
	);
	const [ gridStep ] = gridSteps;

	const updateGridSteps = useCallback( () => {
		setGridSteps( getGridWidths( { ref: containerNode } ) );
	}, [] );

	useEffect( () => {
		updateGridSteps();
	}, [] );

	useEffect( () => {
		setGrid( [ isGrid ? gridStep : 1, 1 ] );
	}, [ isGrid, gridStep ] );

	useEffect( () => {
		window.addEventListener( 'resize', updateGridSteps );
		return () => {
			window.removeEventListener( 'resize', updateGridSteps );
		};
	}, [] );

	const createStyle = ( widths ) => {
		return {
			'--gridColumn1Width': `minmax(8.3334%, ${ widths[ 0 ] })`,
			'--gridColumn2Width': `minmax(8.3334%, ${ widths[ 1 ] })`,
			'--gridColumn3Width': `minmax(8.3334%, ${ widths[ 2 ] })`,
			'--gridColumn4Width': `minmax(8.3334%, 1fr )`,
			'--gridTemplateColumns': `var( --gridColumn1Width ) var( --gridColumn2Width ) var(--gridColumn3Width) var( --gridColumn4Width )`,
			'--gridGap': `${ gap }px`,
		};
	};

	const style = createStyle( columnWidths );

	const enable = {
		top: false,
		right: true,
		bottom: false,
		left: false,
		topRight: false,
		bottomRight: false,
		bottomLeft: false,
		topLeft: false,
	};

	const updateColumns = () => {
		const next = [ ...ghostNode.current.children ].map( ( node ) => {
			let w = node.getBoundingClientRect().width;
			w = isGrid
				? getGridWidthValue( { gridSteps, width: w } )
				: `${ w }px`;

			return w;
		} );

		next.forEach( ( w, i ) => {
			if ( i + 1 === next.length ) return;
			containerNode.current.children[ i ].style.minWidth = '100%';
			containerNode.current.children[ i ].style.maxWidth = '100%';
			containerNode.current.children[ i ].style.width = w;
		} );

		setColumnWidths( next );
		setChangeValue( changeValue + 1 );
	};

	useEffect( () => {
		window.addEventListener( 'resize', updateColumns );
		return () => {
			window.removeEventListener( 'resize', updateColumns );
		};
	}, [ gridSteps ] );

	const handleOnResizeStart = ( ...resizeProps ) => {
		const [ , , element ] = resizeProps;
		element.setAttribute( 'data-column-width', element.clientWidth );
	};

	const handleOnResize = ( index ) => ( ...resizeProps ) => {
		const [ , , element, delta ] = resizeProps;
		const currentWidth = parseInt(
			element.getAttribute( 'data-column-width' ),
			10
		);
		let nextWidth = currentWidth + delta.width;
		nextWidth = isGrid
			? getGridWidthValue( { gridSteps, width: nextWidth } )
			: `${ nextWidth }px`;

		const nextColumnWidths = [ ...columnWidths ];
		nextColumnWidths[ index ] = nextWidth;

		const ghostStyles = createStyle( nextColumnWidths );

		Object.keys( ghostStyles ).forEach( ( key ) => {
			ghostNode.current.style.setProperty( key, ghostStyles[ key ] );
		} );

		nextWidth = ghostNode.current.children[ index ].getBoundingClientRect()
			.width;

		updateColumns();
	};

	const contextProps = {
		isGrid,
		gridSteps,
		changeValue,
	};

	return (
		<>
			<button onClick={ () => setIsGrid( ! isGrid ) }>
				Grid ({ isGrid ? 'ON' : 'OFF' })
			</button>
			<hr />
			<br />
			<RangeControl
				label="Gap"
				value={ gap }
				min={ 0 }
				max={ 100 }
				onChange={ ( next ) => setGap( next ) }
			/>
			<br />
			<br />
			<br />
			<ColumnResizerContext.Provider value={ contextProps }>
				<CSSGridContainerView>
					<ColumnGridVisualizer />
					<GridTestView style={ style } ref={ containerNode }>
						<ResizableBox
							grid={ grid }
							enable={ enable }
							onResizeStart={ handleOnResizeStart }
							onResize={ handleOnResize( 0 ) }
						>
							<BoxView />
						</ResizableBox>
						<ResizableBox
							grid={ grid }
							enable={ enable }
							onResizeStart={ handleOnResizeStart }
							onResize={ handleOnResize( 1 ) }
						>
							<BoxView />
						</ResizableBox>
						<ResizableBox
							grid={ grid }
							enable={ enable }
							onResizeStart={ handleOnResizeStart }
							onResize={ handleOnResize( 2 ) }
						>
							<BoxView />
						</ResizableBox>
						<BoxView />
					</GridTestView>
					<GridTestView ref={ ghostNode } style={ { height: 0 } }>
						{ columnWidths.map( ( width, index ) => (
							<div key={ index } />
						) ) }
					</GridTestView>
				</CSSGridContainerView>
			</ColumnResizerContext.Provider>
		</>
	);
};

export const cssGrid = () => <CSSGridExample />;
