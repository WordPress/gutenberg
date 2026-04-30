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
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import {
	useCropGeometry,
	type CropGeometryRange,
	type CropGeometryApplyOperation,
} from '../../image-editor';

interface CropAdvancedPanelProps {
	aspectRatio?: number;
	freeformCrop: boolean;
	onPlacementControlInteraction?: () => void;
}

interface CropInputProps {
	label: string;
	'aria-label'?: string;
	value: number;
	range: CropGeometryRange;
	disabled?: boolean;
	onCommit: ( value: number ) => void;
}

const pxSuffix = <InputControlSuffixWrapper>px</InputControlSuffixWrapper>;

function getInputBounds( value: number, range: CropGeometryRange ) {
	const rounded = Math.round( value );
	return {
		value: rounded,
		min: Math.min( rounded, Math.floor( range.minValue ) ),
		max: Math.max( rounded, Math.ceil( range.maxValue ) ),
	};
}

// Shows a live draft while the user types, then snaps to the committed
// cropper value when the field blurs or Enter is pressed.
function CropInput( {
	label,
	'aria-label': ariaLabel,
	value,
	range,
	disabled = false,
	onCommit,
}: CropInputProps ) {
	const [ focused, setFocused ] = useState( false );
	const [ draft, setDraft ] = useState( '' );
	const bounds = getInputBounds( value, range );

	const commitValue = ( nextValue: string ) => {
		if ( nextValue.trim() === '' ) {
			return;
		}
		const parsed = Number( nextValue );
		if ( ! Number.isFinite( parsed ) ) {
			return;
		}
		onCommit( parsed );
	};

	const handleFocus = () => {
		setFocused( true );
		setDraft( String( bounds.value ) );
	};

	const handleChange = ( nextValue: string | undefined ) => {
		const valueToCommit = nextValue ?? '';
		setDraft( valueToCommit );
		commitValue( valueToCommit );
	};

	const handleBlur = () => {
		setFocused( false );
		commitValue( draft );
	};

	const handleKeyDown = (
		event: React.KeyboardEvent< HTMLInputElement >
	) => {
		if ( event.key === 'Enter' ) {
			event.preventDefault();
			setFocused( false );
			commitValue( draft );
			event.currentTarget.blur();
		} else if ( event.key === 'Escape' ) {
			event.preventDefault();
			setFocused( false );
			event.currentTarget.blur();
		}
	};

	return (
		<NumberControl
			__next40pxDefaultSize
			label={ label }
			aria-label={ ariaLabel }
			value={ focused ? draft : String( bounds.value ) }
			min={ bounds.min }
			max={ bounds.max }
			step={ 1 }
			disabled={ disabled }
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
	freeformCrop,
	onPlacementControlInteraction,
}: CropAdvancedPanelProps ) {
	const { isReady, rect, capabilities, getRange, applyGeometryOperation } =
		useCropGeometry( { aspectRatio, freeformCrop } );

	if ( ! isReady || ! rect ) {
		return null;
	}

	const commitOperation = ( operation: CropGeometryApplyOperation ) => {
		applyGeometryOperation( operation );
		onPlacementControlInteraction?.();
	};

	const leftRange = getRange( { type: 'move-x' } );
	const topRange = getRange( { type: 'move-y' } );
	const widthRange = getRange( { type: 'resize-width' } );
	const heightRange = getRange( { type: 'resize-height' } );

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
							value={ rect.left }
							range={ leftRange }
							disabled={ ! capabilities.canMoveX }
							onCommit={ ( value ) =>
								commitOperation( { type: 'move-x', value } )
							}
						/>
					</FlexItem>
					<FlexItem isBlock>
						<CropInput
							label={ __( 'Top' ) }
							aria-label={ __( 'Crop top position' ) }
							value={ rect.top }
							range={ topRange }
							disabled={ ! capabilities.canMoveY }
							onCommit={ ( value ) =>
								commitOperation( { type: 'move-y', value } )
							}
						/>
					</FlexItem>
				</Flex>
				<Flex gap={ 2 } align="flex-start">
					<FlexItem isBlock>
						<CropInput
							label={ __( 'Width' ) }
							value={ rect.width }
							range={ widthRange }
							disabled={ ! capabilities.canResizeWidth }
							onCommit={ ( value ) =>
								commitOperation( {
									type: 'resize-width',
									value,
								} )
							}
						/>
					</FlexItem>
					<FlexItem isBlock>
						<CropInput
							label={ __( 'Height' ) }
							value={ rect.height }
							range={ heightRange }
							disabled={ ! capabilities.canResizeHeight }
							onCommit={ ( value ) =>
								commitOperation( {
									type: 'resize-height',
									value,
								} )
							}
						/>
					</FlexItem>
				</Flex>
			</Stack>
		</PanelBody>
	);
}
