/**
 * WordPress dependencies
 */
import { Button, RangeControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { square as zoomOutIcon } from '@wordpress/icons';
import { store as preferencesStore } from '@wordpress/preferences';
import {
	useShortcut,
	store as keyboardShortcutsStore,
} from '@wordpress/keyboard-shortcuts';
import { isAppleOS } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const ZoomOutToggle = ( { disabled } ) => {
	const [ zoomValue, setZoomValue ] = useState( 0.45 );

	const { isZoomOut, showIconLabels, isDistractionFree } = useSelect(
		( select ) => ( {
			isZoomOut: unlock( select( blockEditorStore ) ).isZoomOut(),
			showIconLabels: select( preferencesStore ).get(
				'core',
				'showIconLabels'
			),
			isDistractionFree: select( preferencesStore ).get(
				'core',
				'distractionFree'
			),
		} )
	);

	const { resetZoomLevel, setZoomLevel } = unlock(
		useDispatch( blockEditorStore )
	);
	const { registerShortcut, unregisterShortcut } = useDispatch(
		keyboardShortcutsStore
	);

	useEffect( () => {
		registerShortcut( {
			name: 'core/editor/zoom',
			category: 'global',
			description: __( 'Enter or exit zoom out.' ),
			keyCombination: {
				// `primaryShift+0` (`ctrl+shift+0`) is the shortcut for switching
				// to input mode in Windows, so apply a different key combination.
				modifier: isAppleOS() ? 'primaryShift' : 'secondary',
				character: '0',
			},
		} );
		return () => {
			unregisterShortcut( 'core/editor/zoom' );
		};
	}, [ registerShortcut, unregisterShortcut ] );

	useShortcut(
		'core/editor/zoom',
		() => {
			handleZoomOut();
		},
		{
			isDisabled: isDistractionFree,
		}
	);

	const handleZoomOut = () => {
		if ( isZoomOut ) {
			resetZoomLevel();
		} else {
			setZoomLevel( 'auto-scaled' );
			setZoomValue( 0.45 );
		}
	};

	const handleZoomChange = ( value ) => {
		setZoomValue( value );
		setZoomLevel( value );
	};

	return (
		<>
			<Button
				accessibleWhenDisabled
				disabled={ disabled }
				onClick={ handleZoomOut }
				icon={ zoomOutIcon }
				label={ __( 'Zoom Out' ) }
				isPressed={ isZoomOut }
				size="compact"
				showTooltip={ ! showIconLabels }
				className="editor-zoom-out-toggle"
			/>
			{ isZoomOut && (
				<div className="editor-zoom-control-wrapper">
					<RangeControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						className="editor-zoom-control"
						value={ zoomValue }
						onChange={ handleZoomChange }
						min={ 0.45 }
						max={ 0.95 }
						step={ 0.05 }
						disabled={ disabled }
						withInputField={ false }
					/>
				</div>
			) }
		</>
	);
};

export default ZoomOutToggle;
