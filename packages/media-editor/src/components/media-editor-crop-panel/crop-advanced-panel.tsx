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

const pxSuffix = <InputControlSuffixWrapper>px</InputControlSuffixWrapper>;

interface CropInputProps {
	label: string;
	'aria-label'?: string;
	value: number;
	min: number;
	max: number;
	onCommit: ( value: number ) => void;
}

// Shows a live draft while the user types, then snaps to the committed
// (enforced) value on blur or Enter — canvas updates in real-time without
// the input jumping to a clamped value on each keystroke.
function CropInput( {
	label,
	'aria-label': ariaLabel,
	value,
	min,
	max,
	onCommit,
}: CropInputProps ) {
	const [ focused, setFocused ] = useState( false );
	const [ draft, setDraft ] = useState( '' );

	const handleFocus = () => {
		setFocused( true );
		setDraft( String( value ) );
	};

	const handleChange = ( v: string | undefined ) => {
		setDraft( v ?? '' );
		const parsed = parseInt( v ?? '', 10 );
		if ( ! isNaN( parsed ) ) {
			onCommit( Math.max( min, Math.min( parsed, max ) ) );
		}
	};

	const handleBlur = () => setFocused( false );

	const handleKeyDown = (
		event: React.KeyboardEvent< HTMLInputElement >
	) => {
		if ( event.key === 'Enter' || event.key === 'Escape' ) {
			setFocused( false );
			event.currentTarget.blur();
		}
	};

	return (
		<NumberControl
			__next40pxDefaultSize
			label={ label }
			aria-label={ ariaLabel }
			value={ focused ? draft : String( value ) }
			min={ min }
			max={ max }
			step={ 1 }
			onChange={ handleChange }
			onFocus={ handleFocus }
			onBlur={ handleBlur }
			onKeyDown={ handleKeyDown }
			suffix={ pxSuffix }
		/>
	);
}

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

	if ( ! pixels ) {
		return null;
	}

	const { snapW, snapH } = pixels;

	const handleCommit =
		( field: 'x' | 'y' | 'width' | 'height' ) => ( clamped: number ) => {
			if ( ! state.image ) {
				return;
			}
			const imageSize = {
				width: state.image.naturalWidth,
				height: state.image.naturalHeight,
			};
			setCropRect(
				pixelsToCropRect(
					{
						x: field === 'x' ? clamped : pixels.x,
						y: field === 'y' ? clamped : pixels.y,
						width: field === 'width' ? clamped : pixels.width,
						height: field === 'height' ? clamped : pixels.height,
					},
					state,
					imageSize
				)
			);
			onPlacementControlInteraction?.();
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
						<CropInput
							label={ __( 'Left' ) }
							aria-label={ __( 'Crop left position' ) }
							value={ pixels.x }
							min={ 0 }
							max={ Math.max( 0, snapW - pixels.width ) }
							onCommit={ handleCommit( 'x' ) }
						/>
					</FlexItem>
					<FlexItem isBlock>
						<CropInput
							label={ __( 'Top' ) }
							aria-label={ __( 'Crop top position' ) }
							value={ pixels.y }
							min={ 0 }
							max={ Math.max( 0, snapH - pixels.height ) }
							onCommit={ handleCommit( 'y' ) }
						/>
					</FlexItem>
				</Flex>
				<Flex gap={ 2 } align="flex-start">
					<FlexItem isBlock>
						<CropInput
							label={ __( 'Width' ) }
							value={ pixels.width }
							min={ 1 }
							max={ Math.max( 1, snapW - pixels.x ) }
							onCommit={ handleCommit( 'width' ) }
						/>
					</FlexItem>
					<FlexItem isBlock>
						<CropInput
							label={ __( 'Height' ) }
							value={ pixels.height }
							min={ 1 }
							max={ Math.max( 1, snapH - pixels.y ) }
							onCommit={ handleCommit( 'height' ) }
						/>
					</FlexItem>
				</Flex>
			</Stack>
		</PanelBody>
	);
}
