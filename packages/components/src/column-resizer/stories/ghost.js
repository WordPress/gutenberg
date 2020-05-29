/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import {
	useState,
	useRef,
	useEffect,
	createContext,
	useContext,
	useCallback,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import ResizableBox from '../../resizable-box';
import RangeControl from '../../range-control';
import UnitControl from '../../unit-control';
import { color } from '../../utils/style-mixins';

export default { title: 'Components/ColumnResizer' };

const GRID_SIZE = 12;

const ColumnResizerContext = createContext( { isGrid: true } );
const useColumnResizerContext = () => useContext( ColumnResizerContext );

const CSSGridExample = () => {
	const [ isGrid, setIsGrid ] = useState( true );
	const [ isDragging, setIsDragging ] = useState( false );
	const [ gap, setGap ] = useState( 20 );
	const [ gridSteps, setGridSteps ] = useState( [ 1 ] );
	const [ __updateCount, setUpdateCount ] = useState( 0 );
	const ghostRef = useRef( false );
	const initialRenderRef = useRef( false );
	const didChangeGridSettingRef = useRef( false );
	const baseId = useInstanceId( CSSGridExample, 'column-resizer' );
	const lastUpdateCountRef = useRef( __updateCount );

	const gapRef = useRef( gap );

	const containerNode = useRef();
	const [ columnWidths, setColumnWidths ] = useState( [
		'25%',
		'25%',
		'25%',
		'25%',
	] );

	const getGridSteps = () => {
		if ( ! containerNode.current ) {
			return [ 1 ];
		}

		const containerWidth = containerNode.current.getBoundingClientRect()
			.width;
		const columnWidth = containerWidth / GRID_SIZE;
		const steps = [ ...Array( GRID_SIZE ) ].map( ( v, i ) => {
			return parseFloat( ( columnWidth * ( i + 1 ) ).toFixed( 2 ) );
		} );
		return steps;
	};

	const grid = [ isGrid ? gridSteps[ 0 ] : 1, 1 ];
	const minWidth = gridSteps[ 0 ];

	const incrementUpdateCount = useCallback( () => {
		const nextUpdateCount = lastUpdateCountRef.current + 1;
		setUpdateCount( nextUpdateCount );
		lastUpdateCountRef.current = nextUpdateCount;
	}, [] );

	const handleOnResize = useCallback(
		( event, direction, element ) => {
			const nodes = [
				...containerNode.current.querySelectorAll(
					'.components-resizable-box__container'
				),
			];

			const ghostNodeContainerWidth = ghostRef.current.getBoundingClientRect()
				.width;
			const ghostNodes = [ ...ghostRef.current.children ];

			if ( element ) {
				const nodeIndex = nodes.indexOf( element );
				const targetGhostNode = ghostNodes[ nodeIndex ];

				if ( ! targetGhostNode ) return;

				targetGhostNode.style.width = element.style.width;
			}

			const nextColumnWidths = ghostNodes.map( ( n, index ) => {
				const w = n.getBoundingClientRect().width;
				const nextWidth = isGrid
					? getGridWidthValue( {
							gridSteps: getGridSteps(),
							width: w,
					  } )
					: getPercentageWidthValue( {
							containerWidth: ghostNodeContainerWidth,
							width: w,
					  } );
				ghostNodes[ index ].style.width = nextWidth;
				return nextWidth;
			} );

			setColumnWidths( nextColumnWidths );
			incrementUpdateCount();
		},
		[ incrementUpdateCount, isGrid ]
	);

	useEffect( () => {
		if ( gap !== gapRef.current ) {
			setGridSteps( getGridSteps() );
			incrementUpdateCount();
			gapRef.current = gap;
		}
	}, [ gap, incrementUpdateCount ] );

	useEffect( () => {
		const debouncedResize = () => {
			setGridSteps( getGridSteps() );
		};
		window.addEventListener( 'resize', debouncedResize );
		return () => {
			window.removeEventListener( 'resize', debouncedResize );
		};
	}, [] );

	useEffect( () => {
		if ( gridSteps.length !== GRID_SIZE && ! initialRenderRef.current ) {
			setGridSteps( getGridSteps() );
			initialRenderRef.current = true;
		}
	}, [ gridSteps ] );

	useEffect( () => {
		if ( isGrid === true && didChangeGridSettingRef.current ) {
			handleOnResize();
		}
	}, [ isGrid, handleOnResize ] );

	useEffect( () => {
		// eslint-disable-next-line no-console
		console.log( columnWidths );
	}, [ columnWidths ] );

	const toggleGrid = () => {
		setIsGrid( ! isGrid );
		didChangeGridSettingRef.current = true;
	};

	const contextProps = {
		isGrid,
		grid,
		gap,
		isDragging,
		setIsDragging,
		gridSteps,
		minWidth,
		ghostRef,
		columnWidths,
		onResize: handleOnResize,
		setGridSteps: () => {},
		baseId,
		__updateCount,
	};

	return (
		<>
			<button onClick={ toggleGrid }>
				Grid ({ isGrid ? 'ON' : 'OFF' })
			</button>
			<hr />
			<br />
			<div>Column Widths</div>
			<div style={ { display: 'flex' } }>
				{ columnWidths.map( ( w, i ) => (
					<UnitControl
						key={ i }
						value={ w }
						units={ [ { value: '%' } ] }
						min="8.33334"
						max="91.6667"
						onChange={ ( next ) => {
							const nextColumns = [ ...columnWidths ];
							nextColumns[ i ] = next;
							setIsGrid( false );
							setColumnWidths( nextColumns );
						} }
					/>
				) ) }
			</div>
			<br />
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
			<hr />
			<br />
			<br />
			<ColumnResizerContext.Provider value={ contextProps }>
				<GhostColumns nodeRef={ ghostRef } />
				<CSSGridContainerView>
					<ColumnGridVisualizer />
					<TestContainerView ref={ containerNode }>
						<ColumnWrapper width={ columnWidths[ 0 ] } isFirst>
							<BoxView contentEditable="true">
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
							<BoxView contentEditable="true">
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
							<BoxView contentEditable="true">
								<p>
									Lorem ipsum dolor sit amet, consectetur
									adipiscing elit. Aliquam et porttitor ex.
									Aenean sed ipsum sit amet justo blandit
									rhoncus ac vitae eros.
								</p>
							</BoxView>
						</ColumnWrapper>
						<ColumnWrapper width={ columnWidths[ 3 ] } isLast>
							<BoxView contentEditable="true">
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
					</TestContainerView>
				</CSSGridContainerView>
			</ColumnResizerContext.Provider>
		</>
	);
};

const ColumnWrapper = ( { children, isFirst, isLast, width } ) => {
	const {
		gap,
		grid,
		onResize,
		isDragging,
		setIsDragging,
	} = useColumnResizerContext();
	const lastDelta = useRef();
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
		paddingLeft: isFirst ? 0 : gap / 2,
		paddingRight: isLast ? 0 : gap / 2,
		willChange: 'width',
		userSelect: isDragging ? 'none' : null,
	};

	return (
		<ResizableBox
			size={ { width } }
			onResizeStart={ () => {
				setIsDragging( true );
			} }
			onResize={ ( event, direction, element, delta ) => {
				if ( lastDelta.current === delta.width ) return;
				lastDelta.current = delta.width;

				onResize( event, direction, element, delta );
			} }
			onResizeStop={ () => {
				setIsDragging( false );
			} }
			enable={ enable }
			style={ style }
			grid={ grid }
			minWidth="8.3334%"
		>
			<ResizableVisualizer
				width={ width }
				isFirst={ isFirst }
				isLast={ isLast }
			/>
			{ children }
		</ResizableBox>
	);
};

const GhostColumns = ( { nodeRef, show = false } ) => {
	const { columnWidths } = useColumnResizerContext();

	return (
		<GhostContainerView
			ref={ nodeRef }
			style={ { overflow: 'hidden', height: show ? null : 0 } }
		>
			{ columnWidths.map( ( width, i ) => (
				<GhostColumnView key={ i } style={ { width } }>
					<span role="img" aria-label="ghost">
						👻
					</span>
				</GhostColumnView>
			) ) }
		</GhostContainerView>
	);
};

function ResizableVisualizer( { isFirst, isLast, width } ) {
	const nodeRef = useRef();
	const { __updateCount, gridSteps, isGrid, gap } = useColumnResizerContext();
	const { isActive } = useDebouncedAnimation( __updateCount );

	const getWidthLabel = () => {
		const w = nodeRef?.current?.clientWidth;
		if ( ! w ) return;

		return isGrid
			? getColumnValue( {
					gridSteps,
					width: w,
			  } )
			: width;
	};

	const [ widthLabel, setWidthLabel ] = useState();

	useEffect( () => {
		setWidthLabel( getWidthLabel() );
	}, [ __updateCount ] );

	return (
		<VisualizerView
			ref={ nodeRef }
			isActive={ isActive }
			style={ {
				left: isFirst ? 0 : gap / 2,
				right: isLast ? 0 : gap / 2,
			} }
		>
			<VisualizerLabelView>{ widthLabel }</VisualizerLabelView>
		</VisualizerView>
	);
}

function ColumnGridVisualizer() {
	const { isGrid, gap, __updateCount } = useColumnResizerContext();
	const { isActive } = useDebouncedAnimation( __updateCount );

	if ( ! isGrid ) return null;

	return (
		<VisualizerGridView isActive={ isActive }>
			{ [ ...Array( GRID_SIZE ) ].map( ( n, i ) => (
				<VisualizerGridColumnView key={ i } gap={ gap } />
			) ) }
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

function getGridWidthValue( { gridSteps, width } ) {
	const columnValue = getColumnValue( { gridSteps, width } );

	let widthValue = ( columnValue / GRID_SIZE ) * 100;
	widthValue = `${ widthValue.toFixed( 2 ) }%`;

	return widthValue;
}

function getPercentageWidthValue( { containerWidth, width } ) {
	const currentContainerWidth = parseFloat( containerWidth );
	const currentWidth = parseFloat( width );
	const percentage = ( currentWidth / currentContainerWidth ) * 100;

	return `${ percentage.toFixed( 2 ) }%`;
}

const BoxView = styled.div`
	box-sizing: border-box;

	img {
		max-width: 100%;
		height: auto;
	}
`;

const CSSGridContainerView = styled.div`
	width: 100%;
	position: relative;

	.components-resizable-box__container {
		border: 1px dashed transparent;
		border-top: 0;
		border-bottom: 0;
		transition: border-color 100ms linear;

		&:hover {
			border-color: #ddd;
		}
	}

	.components-resizable-box__handle {
		opacity: 0;
		transition: opacity 100ms linear;
		will-change: opacity;

		&:hover,
		&:active {
			opacity: 1;
		}
	}
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
	will-change: opacity;
	z-index: 1000;

	${( { isActive } ) =>
		isActive &&
		`
		opacity: 1;
	`}
`;

const VisualizerGridColumnView = styled.div`
	box-sizing: border-box;
	height: 100%;
	background: rgba( 80, 160, 255, 0.04 );
	border-left: 1px solid rgba( 80, 160, 255, 0.1 );
	border-right: 1px solid rgba( 80, 160, 255, 0.1 );
	pointer-events: none;
	filter: brightness( 1 );

	${( { gap } ) => `
		margin: 0 ${ gap / 2 }px;
	`}

	&:first-of-type {
		margin-left: 0;
	}
	&:last-of-type {
		margin-right: 0;
	}
`;

/**
 * Trying it out using CSS Grid
 */

const TestContainerView = styled.div`
	box-sizing: border-box;
	display: flex;
`;

const GhostContainerView = styled.div`
	box-sizing: border-box;
	display: flex;
`;

const GhostColumnView = styled.div`
	box-sizing: border-box;
	background: #f2f2f2;
	text-align: center;
	padding: 20px;
	border: 1px solid #ddd;
	border-top: none;
	border-bottom: none;
	min-width: 8.33334%;
	max-width: 91.6667%;

	&:last-of-type {
		flex: 1;
		width: auto;
	}
`;

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
	will-change: opacity;
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
