/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * WordPress dependencies
 */
import { useState, useRef, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ResizableBox from '../../resizable-box';
import RangeControl from '../../range-control';
import { color } from '../../utils/style-mixins';

export default { title: 'Components/ColumnResizer' };

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

const BoxView = styled.div`
	background: #eee;
	padding: 20px;
	border: 2px solid #ccc;
	height: 200px;
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
	border-left: 1px dashed ${color( 'ui.brand' )};
	border-right: 1px dashed ${color( 'ui.brand' )};
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
			<CSSGridContainerView>
				<ColumnGridVisualizer
					gap={ gap }
					onChangeGridSteps={ setGridSteps }
					changeValue={ __updateCount }
				/>
				<GridTestView ref={ containerNode }>
					<ColumnWrapper
						width={ columnWidths[ 0 ] }
						grid={ grid }
						gap={ gap }
						isFirst
						onResize={ handleOnResize }
						minWidth={ minWidth }
					>
						<BoxView />
					</ColumnWrapper>
					<ColumnWrapper
						width={ columnWidths[ 1 ] }
						grid={ grid }
						gap={ gap }
						onResize={ handleOnResize }
						minWidth={ minWidth }
					>
						<BoxView />
					</ColumnWrapper>
					<ColumnWrapper
						width={ columnWidths[ 2 ] }
						grid={ grid }
						gap={ gap }
						onResize={ handleOnResize }
						minWidth={ minWidth }
					>
						<BoxView />
					</ColumnWrapper>
					<ColumnWrapper
						width={ columnWidths[ 3 ] }
						isLast
						grid={ grid }
						gap={ gap }
						onResize={ handleOnResize }
						minWidth={ minWidth }
					>
						<BoxView />
					</ColumnWrapper>
				</GridTestView>
			</CSSGridContainerView>
		</>
	);
};

const ColumnWrapper = ( {
	children,
	isLast,
	width,
	grid,
	minWidth,
	onResize,
	gap,
} ) => {
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
			{ children }
		</ResizableBox>
	);
};

function ColumnGridVisualizer( { gap, changeValue, onChangeGridSteps } ) {
	const { isActive } = useDebouncedAnimation( changeValue );
	const node = useRef();

	const updateGridSteps = () => {
		const columnNodes = [ ...node.current.children ];
		const nextGridSteps = columnNodes.map(
			( n ) =>
				n.getBoundingClientRect().left + n.getBoundingClientRect().width
		);
		onChangeGridSteps( nextGridSteps );
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
	return values.reduce( ( prev, curr ) => {
		return Math.abs( curr - value ) < Math.abs( prev - value )
			? curr
			: prev;
	}, [] );
}

export const ghostGrid = () => <CSSGridExample />;
