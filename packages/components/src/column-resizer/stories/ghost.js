/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * WordPress dependencies
 */
import {
	useState,
	useRef,
	useEffect,
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

const CSSGridContainerView = styled.div`
	width: 100%;
	position: relative;

	.components-resizable-box__handle {
		opacity: 0;
		transition: opacity 100ms linear;

		&:hover,
		&:active {
			opacity: 1;
		}
	}
`;

const CSSGridExample = () => {
	const [ isGrid, setIsGrid ] = useState( true );
	const [ gap, setGap ] = useState( 20 );
	const [ gridSteps, setGridSteps ] = useState( [ 1 ] );
	const [ __updateCount, setUpdateCount ] = useState( 0 );

	const gapRef = useRef( gap );

	const containerNode = useRef();
	const [ columnWidths, setColumnWidths ] = useState( [
		'25%',
		'25%',
		'25%',
		'25%',
	] );

	const grid = [ gridSteps[ 0 ], 1 ];
	const minWidth = gridSteps[ 0 ];

	const handleOnResize = () => {
		const nodes = [
			...containerNode.current.querySelectorAll(
				'.components-resizable-box__container'
			),
		];
		nodes.forEach( ( n ) => {
			const w = getNearestValue(
				gridSteps,
				n.getBoundingClientRect().width
			);
			n.style.width = `${ w }px`;
		} );

		const nextColumnWidths = nodes.map( ( n ) => {
			const w = n.getBoundingClientRect().width;
			return `${ w }px`;
		} );

		setColumnWidths( nextColumnWidths );
		setUpdateCount( __updateCount + 1 );
	};

	useEffect( () => {
		if ( gap !== gapRef.current ) {
			handleOnResize();
			gapRef.current = gap;
		}
	}, [ gap ] );

	useEffect( () => {
		window.addEventListener( 'resize', handleOnResize );
		return () => {
			window.removeEventListener( 'resize', handleOnResize );
		};
	} );

	const contextProps = {
		isGrid: true,
		grid,
		gap,
		gridSteps,
		minWidth,
		onResize: handleOnResize,
		setGridSteps,
		__updateCount,
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
				max={ 40 }
				onChange={ ( next ) => setGap( next ) }
			/>
			<br />
			<br />
			<br />
			<ColumnResizerContext.Provider value={ contextProps }>
				<CSSGridContainerView>
					<ColumnGridVisualizer />
					<GridTestView ref={ containerNode }>
						<ColumnWrapper width={ columnWidths[ 0 ] } isFirst>
							<BoxView>
								<p>
									Lorem ipsum dolor sit amet, consectetur
									adipiscing elit. Aliquam et porttitor ex.
									Aenean sed ipsum sit amet justo blandit
									rhoncus ac vitae eros. Nulla congue semper
									enim sed euismod. Donec sed faucibus lacus,
									vel consectetur lorem. Vivamus in
									pellentesque nisi. Sed hendrerit tempor
									volutpat.
								</p>
							</BoxView>
						</ColumnWrapper>
						<ColumnWrapper width={ columnWidths[ 1 ] }>
							<BoxView>
								<h1>
									Lorem ipsum dolor sit amet, consectetur
									adipiscing elit.
								</h1>
								<p>
									Aliquam et porttitor ex. Aenean sed ipsum
									sit amet justo blandit rhoncus ac vitae
									eros. Nulla congue semper enim sed euismod.
									Donec sed faucibus lacus, vel consectetur
									lorem. Vivamus in pellentesque nisi. Sed
									hendrerit tempor volutpat.
								</p>
							</BoxView>
						</ColumnWrapper>
						<ColumnWrapper width={ columnWidths[ 2 ] }>
							<BoxView>
								<p>
									Lorem ipsum dolor sit amet, consectetur
									adipiscing elit. Aliquam et porttitor ex.
									Aenean sed ipsum sit amet justo blandit
									rhoncus ac vitae eros.
								</p>
							</BoxView>
						</ColumnWrapper>
						<ColumnWrapper width={ columnWidths[ 3 ] } isLast>
							<BoxView>
								<h2>
									Nulla congue semper enim sed euismod. Donec
									sed faucibus lacus, vel consectetur lorem.
									Vivamus in pellentesque nisi. Sed hendrerit
									tempor volutpat.
								</h2>
								<p>
									Lorem ipsum dolor sit amet, consectetur
									adipiscing elit. Aliquam et porttitor ex.
									Aenean sed ipsum sit amet justo blandit
									rhoncus ac vitae eros. Nulla congue semper
									enim sed euismod. Donec sed faucibus lacus,
									vel consectetur lorem. Vivamus in
									pellentesque nisi. Sed hendrerit tempor
									volutpat.
								</p>
							</BoxView>
						</ColumnWrapper>
					</GridTestView>
				</CSSGridContainerView>
			</ColumnResizerContext.Provider>
		</>
	);
};

const ColumnWrapper = ( { children, isLast, width } ) => {
	const { gap, minWidth, grid, onResize } = useColumnResizerContext();

	const enable = {
		top: false,
		right: ! isLast,
		bottom: false,
		left: false,
		topRight: false,
		bottomRight: false,
		bottomLeft: false,
		topLeft: false,
	};

	const style = {
		flex: isLast ? 1 : null,
		marginRight: isLast ? 0 : gap,
	};

	return (
		<ResizableBox
			size={ { width } }
			onResizeStart={ ( event, direction, element ) => {
				element.setAttribute(
					'data-column-width',
					`${ element.getBoundingClientRect().width }`
				);
			} }
			onResize={ ( event, direction, element ) => {
				const startingWidth = parseFloat(
					element.getAttribute( 'data-column-width' )
				);
				const currentWidth = element.getBoundingClientRect().width;

				if ( startingWidth === currentWidth ) return;

				onResize();
			} }
			enable={ enable }
			style={ style }
			grid={ grid }
			minWidth={ minWidth }
		>
			<ResizableVisualizer />
			{ children }
		</ResizableBox>
	);
};

function ResizableVisualizer() {
	const nodeRef = useRef();
	const { __updateCount, gridSteps, isGrid } = useColumnResizerContext();
	const { isActive } = useDebouncedAnimation( __updateCount );

	const getWidthLabel = () => {
		const width = nodeRef?.current?.clientWidth;
		if ( ! width ) return;

		return isGrid
			? getColumnValue( {
					gridSteps,
					width,
			  } )
			: Math.round( width );
	};

	const [ widthLabel, setWidthLabel ] = useState();

	useEffect( () => {
		setWidthLabel( getWidthLabel() );
	}, [ __updateCount ] );

	return (
		<VisualizerView ref={ nodeRef } isActive={ isActive }>
			<VisualizerLabelView>{ widthLabel }</VisualizerLabelView>
		</VisualizerView>
	);
}

function ColumnGridVisualizer() {
	const { gap, __updateCount, setGridSteps } = useColumnResizerContext();
	const { isActive } = useDebouncedAnimation( __updateCount );
	const node = useRef();

	const updateGridSteps = () => {
		const columnNodes = [ ...node.current.children ];
		const nextGridSteps = columnNodes.map(
			( n ) =>
				n.getBoundingClientRect().left + n.getBoundingClientRect().width
		);
		setGridSteps( nextGridSteps );
	};

	useEffect( () => {
		window.addEventListener( 'resize', updateGridSteps );
		return () => {
			window.removeEventListener( 'resize', updateGridSteps );
		};
	}, [] );

	useEffect( () => {
		updateGridSteps();
	}, [ gap ] );

	return (
		<VisualizerGridView
			ref={ node }
			isActive={ isActive }
			style={ { gridGap: gap } }
		>
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

function getNearestValue( values = [], value = 0 ) {
	const parsedValue = parseFloat( value );
	return values.reduce( ( prev, curr ) => {
		return Math.abs( curr - parsedValue ) < Math.abs( prev - parsedValue )
			? curr
			: prev;
	}, [] );
}

function getColumnValue( { gridSteps, width } ) {
	const columnValue = getNearestValue( gridSteps, width );
	return gridSteps.indexOf( columnValue ) + 1;
}

export function getGridWidthValue( { gridSteps, width } ) {
	const columnValue = getColumnValue( { gridSteps, width } );

	let widthValue = ( columnValue / GRID_SIZE ) * 100;
	widthValue = `${ widthValue.toFixed( 2 ) }%`;

	return widthValue;
}

const BoxView = styled.div`
	box-sizing: border-box;
`;

const VisualizerGridView = styled.div`
	display: grid;
	grid-template-columns: repeat( 12, 1fr );
	position: absolute;
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
	border-left: 1px dashed rgba( 0, 0, 0, 0.2 );
	border-right: 1px dashed rgba( 0, 0, 0, 0.2 );
	height: 100%;
	pointer-events: none;
	filter: brightness( 1 );
`;

/**
 * Trying it out using CSS Grid
 */

const GridTestView = styled.div`
	box-sizing: border-box;
	display: flex;
`;

// const ColumnSizeVisualizerView = styled.div`
// 	display: flex;
// 	align-items: center;
// 	justify-content: center;
// 	position: absolute;
// 	top: 0;
// 	bottom: 0;
// 	left: 0;
// 	right: 0;
// 	opacity: 0;
// 	pointer-events: none;
// 	transition: opacity 100ms linear;
// 	z-index: 10;
// 	background: rgba( 0, 0, 0, 0.04 );

// 	${( { isActive } ) =>
// 		isActive &&
// 		`
// 		opacity: 1;
// 	`}
// `;

// const ColumnSizeVisualizerLabelView = styled.div`
// 	font-size: 64px;
// 	line-height: 1;
// 	color: white;
// 	text-align: center;
// 	font-weight: 500;
// 	text-shadow: 0 2px 4px rgba( 0, 0, 0, 0.2 ), 0 4px 10px rgba( 0, 0, 0, 0.2 );
// `;

const VisualizerView = styled.div`
	position: absolute;
	filter: brightness( 2 );
	border: 1px solid ${color( 'ui.brand' )};
	border-bottom: none;
	top: -7px;
	left: 0;
	right: 0;
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
	font-size: 12px;
	top: -18px;
	position: relative;
`;

export const ghostGrid = () => <CSSGridExample />;
