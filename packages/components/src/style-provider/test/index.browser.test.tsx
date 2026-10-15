import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import {
	createPortal,
	useLayoutEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { registerStyle } from '@wordpress/style-runtime';
import StyleProvider from '..';

function MeasuredContent( {
	onMeasure,
}: {
	onMeasure: ( size: { width: number; height: number } ) => void;
} ) {
	const ref = useRef< HTMLDivElement >( null );
	useLayoutEffect( () => {
		onMeasure( {
			width: ref.current!.clientWidth,
			height: ref.current!.clientHeight,
		} );
	}, [ onMeasure ] );
	return (
		<div ref={ ref } className="style-provider-measurement">
			Measured content
		</div>
	);
}

function ControlFrame( {
	onMeasure,
}: React.ComponentProps< typeof MeasuredContent > ) {
	const [ frame, setFrame ] = useState< HTMLIFrameElement | null >( null );
	const doc = frame?.contentDocument;
	return (
		<iframe title="Measurement document" ref={ setFrame }>
			{ doc &&
				createPortal(
					<StyleProvider document={ doc }>
						<MeasuredContent onMeasure={ onMeasure } />
					</StyleProvider>,
					doc.body
				) }
		</iframe>
	);
}

it( 'provides styles before children measure layout in iframe documents', async () => {
	registerStyle(
		'style-provider-measurement',
		'.style-provider-measurement{width:200px;height:100px;}'
	);
	const measureFrame = vi.fn();
	await render( <ControlFrame onMeasure={ measureFrame } /> );
	expect( measureFrame ).toHaveBeenCalledExactlyOnceWith( {
		width: 200,
		height: 100,
	} );
} );
