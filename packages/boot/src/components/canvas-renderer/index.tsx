/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Canvas from '../canvas';
import type { CanvasData } from '../../store/types';

interface CanvasRendererProps {
	canvas: CanvasData | null | undefined;
	routeContentModule?: string;
}

interface LoadedCustomCanvas {
	routeContentModule: string;
	CustomCanvas: any;
}

/**
 * CanvasRenderer handles rendering of both default and custom canvas components.
 * The logic here would have been way simpler if we just render the canvas within
 * the RouteComponent like the other surfaces.
 * The issue is that doing so forces the canvas to remount on every route change,
 * which is not desirable for smooth transitions.
 *
 * - When canvas is undefined: No canvas is rendered
 * - When canvas is null: Loads and renders custom canvas from contentModulePath
 * - When canvas is CanvasData: Renders default Canvas component with editor
 *
 * This component is designed to be rendered at the Root level to prevent
 * remounting when navigating between routes.
 *
 * @param props                    Component props
 * @param props.canvas             Canvas data from route loader
 * @param props.routeContentModule Path to content module for custom canvas
 * @return Canvas renderer
 */
export default function CanvasRenderer( {
	canvas,
	routeContentModule,
}: CanvasRendererProps ) {
	const [ loadedCustomCanvas, setLoadedCustomCanvas ] =
		useState< LoadedCustomCanvas | null >( null );

	useEffect( () => {
		if (
			( canvas === null || canvas?.customCanvas ) &&
			routeContentModule
		) {
			let isCurrent = true;
			import( routeContentModule )
				.then( ( module ) => {
					if ( isCurrent ) {
						setLoadedCustomCanvas( {
							routeContentModule,
							CustomCanvas: module.canvas,
						} );
					}
				} )
				.catch( ( error ) => {
					// eslint-disable-next-line no-console
					console.error( 'Failed to load custom canvas:', error );
				} );

			return () => {
				isCurrent = false;
			};
		}

		setLoadedCustomCanvas( null );
		return undefined;
	}, [ canvas, routeContentModule ] );

	// No canvas
	if ( canvas === undefined ) {
		return null;
	}

	// Custom canvas
	if ( canvas === null || canvas.customCanvas ) {
		if (
			! routeContentModule ||
			loadedCustomCanvas?.routeContentModule !== routeContentModule
		) {
			return null; // Still loading
		}
		const { CustomCanvas } = loadedCustomCanvas;
		return <CustomCanvas />;
	}

	// Default canvas
	return <Canvas canvas={ canvas } />;
}
