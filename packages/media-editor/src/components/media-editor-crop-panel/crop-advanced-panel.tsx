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
import {
	getCropPixels,
	getReachableCropBoundsInPixels,
	pixelsToCropRect,
} from '../../utils/crop-pixels';

interface CropAdvancedPanelProps {
	/** Resolved aspect ratio (width / height). When set, Width and Height inputs are linked. */
	aspectRatio?: number;
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
// the input jumping to a constrained value on each keystroke.
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

	const commit = () => {
		const parsed = parseInt( draft, 10 );
		if ( ! isNaN( parsed ) ) {
			onCommit( Math.max( min, Math.min( parsed, max ) ) );
		}
	};

	const handleBlur = () => {
		setFocused( false );
		commit();
	};

	const handleKeyDown = (
		event: React.KeyboardEvent< HTMLInputElement >
	) => {
		if ( event.key === 'Enter' ) {
			setFocused( false );
			commit();
			event.currentTarget.blur();
		} else if ( event.key === 'Escape' ) {
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
	aspectRatio,
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
		const reach = getReachableCropBoundsInPixels( state, imageSize );
		return {
			x: Math.round( raw.x ),
			y: Math.round( raw.y ),
			width: Math.round( raw.width ),
			height: Math.round( raw.height ),
			minLeft: Math.max( 0, Math.floor( reach.minLeft - 0.5 ) ),
			minTop: Math.max( 0, Math.floor( reach.minTop - 0.5 ) ),
			maxRight: Math.floor( reach.maxRight ),
			maxBottom: Math.floor( reach.maxBottom ),
		};
	}, [ state ] );

	if ( ! pixels ) {
		return null;
	}

	const { minLeft, minTop, maxRight, maxBottom } = pixels;

	const handleApply =
		( field: 'x' | 'y' | 'width' | 'height' ) => ( clamped: number ) => {
			if ( ! state.image ) {
				return;
			}
			const imageSize = {
				width: state.image.naturalWidth,
				height: state.image.naturalHeight,
			};

			// When an aspect ratio is locked, derive the paired dimension so
			// both stay consistent. enforceContainment will clamp the result
			// if it falls outside the valid crop bounds.
			let newWidth = field === 'width' ? clamped : pixels.width;
			let newHeight = field === 'height' ? clamped : pixels.height;
			if ( aspectRatio && aspectRatio > 0 ) {
				if ( field === 'width' ) {
					newHeight = Math.max(
						1,
						Math.round( clamped / aspectRatio )
					);
				} else if ( field === 'height' ) {
					newWidth = Math.max(
						1,
						Math.round( clamped * aspectRatio )
					);
				}
			}

			setCropRect(
				pixelsToCropRect(
					{
						x: field === 'x' ? clamped : pixels.x,
						y: field === 'y' ? clamped : pixels.y,
						width: newWidth,
						height: newHeight,
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
							min={ minLeft }
							max={ Math.max( minLeft, maxRight - pixels.width ) }
							onCommit={ handleApply( 'x' ) }
						/>
					</FlexItem>
					<FlexItem isBlock>
						<CropInput
							label={ __( 'Top' ) }
							aria-label={ __( 'Crop top position' ) }
							value={ pixels.y }
							min={ minTop }
							max={ Math.max(
								minTop,
								maxBottom - pixels.height
							) }
							onCommit={ handleApply( 'y' ) }
						/>
					</FlexItem>
				</Flex>
				<Flex gap={ 2 } align="flex-start">
					<FlexItem isBlock>
						<CropInput
							label={ __( 'Width' ) }
							value={ pixels.width }
							min={ 1 }
							max={ Math.max( 1, maxRight - pixels.x ) }
							onCommit={ handleApply( 'width' ) }
						/>
					</FlexItem>
					<FlexItem isBlock>
						<CropInput
							label={ __( 'Height' ) }
							value={ pixels.height }
							min={ 1 }
							max={ Math.max( 1, maxBottom - pixels.y ) }
							onCommit={ handleApply( 'height' ) }
						/>
					</FlexItem>
				</Flex>
			</Stack>
		</PanelBody>
	);
}
