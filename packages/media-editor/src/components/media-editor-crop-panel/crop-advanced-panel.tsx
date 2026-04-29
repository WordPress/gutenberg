/**
 * WordPress dependencies
 */
import {
	__experimentalInputControlSuffixWrapper as InputControlSuffixWrapper,
	__experimentalNumberControl as NumberControl,
	Flex,
	FlexItem,
	PanelBody,
} from '@wordpress/components';
import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { useCropper } from '../../image-editor';
import { getCropPixels, pixelsToCropRect } from '../../utils/crop-pixels';

interface CropAdvancedPanelProps {
	onPlacementControlInteraction?: () => void;
}

type Field = 'x' | 'y' | 'width' | 'height';
type Drafts = Record< Field, string >;

const pxSuffix = <InputControlSuffixWrapper>px</InputControlSuffixWrapper>;

export default function CropAdvancedPanel( {
	onPlacementControlInteraction,
}: CropAdvancedPanelProps ) {
	const { state, setCropRect } = useCropper();

	const pixels = useMemo( () => {
		if ( ! state.image ) {
			return null;
		}
		const imageSize = {
			width: state.image.naturalWidth,
			height: state.image.naturalHeight,
		};
		const raw = getCropPixels( state, imageSize );
		return {
			x: Math.round( raw.x ),
			y: Math.round( raw.y ),
			width: Math.round( raw.width ),
			height: Math.round( raw.height ),
			snapW: Math.round( raw.snapBBoxWidth ),
			snapH: Math.round( raw.snapBBoxHeight ),
		};
	}, [ state ] );

	// Which field is actively focused. Used to switch between showing the
	// user's draft (free typing) and the committed pixel value from state.
	const [ focusedField, setFocusedField ] = useState< Field | null >( null );

	// The typed string value for the focused field. Only consulted when the
	// field is focused — otherwise the display derives from pixels directly,
	// so it stays in sync with canvas-driven changes at no extra cost.
	const [ drafts, setDrafts ] = useState< Drafts >( {
		x: '',
		y: '',
		width: '',
		height: '',
	} );

	if ( ! pixels ) {
		return null;
	}

	const { snapW, snapH } = pixels;

	// Returns the value to show in each input. While focused: the raw typed
	// draft. While not focused: the committed pixel value (always current).
	const displayValue = ( field: Field ): string =>
		focusedField === field ? drafts[ field ] : String( pixels[ field ] );

	const handleFocus = ( field: Field ) => () => {
		setFocusedField( field );
		// Seed the draft with the current committed value so the user sees the
		// right starting point before they begin typing.
		setDrafts( ( prev ) => ( {
			...prev,
			[ field ]: String( pixels[ field ] ),
		} ) );
	};

	const handleChange = ( field: Field ) => ( v: string | undefined ) => {
		// Always update the draft so the input shows what the user typed.
		setDrafts( ( prev ) => ( { ...prev, [ field ]: v ?? '' } ) );

		const parsed = parseInt( v ?? '', 10 );
		if ( isNaN( parsed ) || ! state.image ) {
			return;
		}

		// Clamp to valid bounds for a best-effort live update. enforceContainment
		// in the reducer is the authoritative constraint and will catch anything
		// we miss here, so the cropper never ends up in an invalid state.
		const clamped = {
			x:
				field === 'x'
					? Math.max( 0, Math.min( parsed, snapW - pixels.width ) )
					: pixels.x,
			y:
				field === 'y'
					? Math.max( 0, Math.min( parsed, snapH - pixels.height ) )
					: pixels.y,
			width:
				field === 'width'
					? Math.max( 1, Math.min( parsed, snapW - pixels.x ) )
					: pixels.width,
			height:
				field === 'height'
					? Math.max( 1, Math.min( parsed, snapH - pixels.y ) )
					: pixels.height,
		};

		const imageSize = {
			width: state.image.naturalWidth,
			height: state.image.naturalHeight,
		};

		setCropRect( pixelsToCropRect( clamped, state, imageSize ) );
		onPlacementControlInteraction?.();
	};

	const handleBlur = ( field: Field ) => () => {
		// Clear the focused field — displayValue switches to pixels[field],
		// which reflects the enforced value after the last onChange commit.
		setFocusedField( ( prev ) => ( prev === field ? null : prev ) );
	};

	const handleKeyDown =
		( field: Field ) =>
		( event: React.KeyboardEvent< HTMLInputElement > ) => {
			if ( event.key === 'Enter' || event.key === 'Escape' ) {
				setFocusedField( ( prev ) => ( prev === field ? null : prev ) );
				event.currentTarget.blur();
			}
		};

	return (
		<PanelBody
			title={ __( 'Advanced' ) }
			initialOpen={ false }
			className="media-editor-crop-advanced-panel"
		>
			<Stack direction="column" gap="sm">
				<Flex gap={ 2 } align="flex-start">
					<FlexItem isBlock>
						<NumberControl
							__next40pxDefaultSize
							label={ __( 'Left' ) }
							aria-label={ __( 'Crop left position' ) }
							value={ displayValue( 'x' ) }
							min={ 0 }
							max={ Math.max( 0, snapW - pixels.width ) }
							step={ 1 }
							onChange={ handleChange( 'x' ) }
							onFocus={ handleFocus( 'x' ) }
							onBlur={ handleBlur( 'x' ) }
							onKeyDown={ handleKeyDown( 'x' ) }
							suffix={ pxSuffix }
						/>
					</FlexItem>
					<FlexItem isBlock>
						<NumberControl
							__next40pxDefaultSize
							label={ __( 'Top' ) }
							aria-label={ __( 'Crop top position' ) }
							value={ displayValue( 'y' ) }
							min={ 0 }
							max={ Math.max( 0, snapH - pixels.height ) }
							step={ 1 }
							onChange={ handleChange( 'y' ) }
							onFocus={ handleFocus( 'y' ) }
							onBlur={ handleBlur( 'y' ) }
							onKeyDown={ handleKeyDown( 'y' ) }
							suffix={ pxSuffix }
						/>
					</FlexItem>
				</Flex>
				<Flex gap={ 2 } align="flex-start">
					<FlexItem isBlock>
						<NumberControl
							__next40pxDefaultSize
							label={ __( 'Width' ) }
							value={ displayValue( 'width' ) }
							min={ 1 }
							max={ Math.max( 1, snapW - pixels.x ) }
							step={ 1 }
							onChange={ handleChange( 'width' ) }
							onFocus={ handleFocus( 'width' ) }
							onBlur={ handleBlur( 'width' ) }
							onKeyDown={ handleKeyDown( 'width' ) }
							suffix={ pxSuffix }
						/>
					</FlexItem>
					<FlexItem isBlock>
						<NumberControl
							__next40pxDefaultSize
							label={ __( 'Height' ) }
							value={ displayValue( 'height' ) }
							min={ 1 }
							max={ Math.max( 1, snapH - pixels.y ) }
							step={ 1 }
							onChange={ handleChange( 'height' ) }
							onFocus={ handleFocus( 'height' ) }
							onBlur={ handleBlur( 'height' ) }
							onKeyDown={ handleKeyDown( 'height' ) }
							suffix={ pxSuffix }
						/>
					</FlexItem>
				</Flex>
			</Stack>
		</PanelBody>
	);
}
