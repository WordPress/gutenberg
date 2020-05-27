/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState, useRef, useEffect, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ResizableBox from '../../resizable-box';

export default { title: 'Components/ColumnResizer' };

const GRID_SIZE = 12;

function ResizableBoxWrapper( props ) {
	const {
		children,
		isGrid,
		onResizeStart = noop,
		onResizeStop = noop,
		onResize = noop,
		onChange = noop,
		...otherProps
	} = props;
	const resizableRef = useRef();

	const [ width, setWidth ] = useState( props?.size?.width );
	const [ tempWidth, setTempWidth ] = useState( 0 );
	const [ grid, setGrid ] = useState( [ 1, 1 ] );

	const [ gridSteps, setGridSteps ] = useState(
		getGridWidths( { ref: resizableRef } )
	);
	const [ gridStep ] = gridSteps;

	const updateShiftStep = useCallback( () => {
		setGridSteps( getGridWidths( { ref: resizableRef } ) );
	} );

	useEffect( () => {
		updateShiftStep();
	}, [] );

	useEffect( () => {
		window.addEventListener( 'resize', updateShiftStep );
		return () => {
			window.removeEventListener( 'resize', updateShiftStep );
		};
	}, [] );

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
		flex: width !== undefined ? null : 1,
	};

	const handleOnResize = ( event, direction, node, delta ) => {
		const { shiftKey } = event;
		const dw = delta.width;
		const nextWidth = tempWidth + dw;

		if ( isGrid ) {
			setGrid( [ gridStep, 1 ] );
		} else {
			setGrid( [ shiftKey ? 10 : 1, 1 ] );
		}

		onResize( event, direction, node, delta );
		if ( nextWidth !== width ) {
			setWidth( nextWidth );

			let onChangeWidth = nextWidth;
			const data = {
				width: nextWidth,
			};

			if ( isGrid ) {
				const columnValue = getNearestValue( gridSteps, nextWidth );
				const column = gridSteps.indexOf( columnValue ) + 1;
				data.column = column;
				onChangeWidth = `${ ( column / GRID_SIZE ) * 100 }%`;
			}
			onChange( onChangeWidth, { event, ...data } );
		}
	};

	const handleOnResizeStop = ( ...args ) => {
		setTempWidth( 0 );
		onResizeStop( ...args );
	};

	const resizableGrid = grid;

	return (
		<ResizableBox
			{ ...otherProps }
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
			minWidth="16.6667%"
			maxWidth="83.3334%"
		>
			{ children }
		</ResizableBox>
	);
}

export const _default = () => {
	const [ isGrid, setIsGrid ] = useState( true );

	return (
		<>
			<button onClick={ () => setIsGrid( ! isGrid ) }>
				Grid ({ isGrid ? 'ON' : 'OFF' })
			</button>
			<hr />
			<ContainerView>
				<ResizableBoxWrapper
					isGrid={ isGrid }
					enable={ {
						right: true,
					} }
				>
					<BoxView />
				</ResizableBoxWrapper>
				<ResizableBoxWrapper isGrid={ isGrid }>
					<BoxView />
				</ResizableBoxWrapper>
			</ContainerView>
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

function getContainerNodeWidth( { ref } ) {
	const containerNode = ref?.current?.resizable?.parentElement;
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

function getNearestValue( values, value ) {
	return values.reduce( ( prev, curr ) => {
		return Math.abs( curr - value ) < Math.abs( prev - value )
			? curr
			: prev;
	} );
}
