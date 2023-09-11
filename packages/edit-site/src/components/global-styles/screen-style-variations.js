/**
 * WordPress dependencies
 */
import { Card, CardBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useEffect, useRef } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import StyleVariationsContainer from './style-variations-container';

function ScreenStyleVariations() {
	const { mode } = useSelect( ( select ) => {
		return {
			mode: select( blockEditorStore ).__unstableGetEditorMode(),
		};
	}, [] );

	const shouldRevertInitialMode = useRef( null );
	useEffect( () => {
		// ignore changes to zoom-out mode as we explictily change to it on mount.
		if ( mode !== 'zoom-out' ) {
			shouldRevertInitialMode.current = false;
		}
	}, [ mode ] );

	// Intentionality left without any dependency.
	// This effect should only run the first time the component is rendered.
	// The effect opens the zoom-out view if it is not open before when applying a style variation.
	useEffect( () => {
		if ( mode !== 'zoom-out' ) {
			__unstableSetEditorMode( 'zoom-out' );
			shouldRevertInitialMode.current = true;
			return () => {
				// if there were not mode changes revert to the initial mode when unmounting.
				if ( shouldRevertInitialMode.current ) {
					__unstableSetEditorMode( mode );
				}
			};
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	const { __unstableSetEditorMode } = useDispatch( blockEditorStore );

	return (
		<>
			<ScreenHeader
				back="/"
				title={ __( 'Browse styles' ) }
				description={ __(
					'Choose a variation to change the look of the site.'
				) }
			/>

			<Card
				size="small"
				isBorderless
				className="edit-site-global-styles-screen-style-variations"
			>
				<CardBody>
					<StyleVariationsContainer />
				</CardBody>
			</Card>
		</>
	);
}

export default ScreenStyleVariations;
