/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	InspectorControls,
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import {
	RangeControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';
import SliderControls, { useSliderSlides } from './controls';
import {
	DEFAULT_PEEK_AMOUNT,
	DEFAULT_PEEK_UNIT,
	getSliderStyle,
	isZeroPeek,
	ZERO_PEEK_CLASS,
} from './utils';

const PERCENT_PEEK_AMOUNT = 8;
const SLIDER_TEMPLATE = [ [ 'core/slide' ], [ 'core/slide' ] ];

function getPeekMax( unit ) {
	return unit === '%' ? 30 : 160;
}

function SliderEditorControls( { activeSlideIndex, slideCount } ) {
	const hasPrevious = activeSlideIndex > 0;
	const hasNext = activeSlideIndex < slideCount - 1;
	const slideStatus = sprintf(
		/* translators: 1: current slide number, 2: total slide count. */
		__( 'Slide %1$s of %2$s' ),
		activeSlideIndex + 1,
		slideCount
	);

	return (
		<div
			className="wp-block-slider__controls"
			aria-label={ __( 'Slider controls' ) }
			aria-hidden="true"
		>
			<button
				type="button"
				className="wp-block-slider__arrow wp-block-slider__arrow--previous"
				aria-label={ __( 'Previous slide' ) }
				disabled={ ! hasPrevious }
				tabIndex={ -1 }
			>
				&lsaquo;
			</button>
			<div className="wp-block-slider__dots" aria-hidden="true">
				<span
					className={ clsx(
						'wp-block-slider__dot',
						'wp-block-slider__dot--previous',
						{
							'is-visible': hasPrevious,
						}
					) }
				/>
				<span className="wp-block-slider__dot wp-block-slider__dot--active is-visible is-active" />
				<span
					className={ clsx(
						'wp-block-slider__dot',
						'wp-block-slider__dot--next',
						{
							'is-visible': hasNext,
						}
					) }
				/>
			</div>
			<button
				type="button"
				className="wp-block-slider__arrow wp-block-slider__arrow--next"
				aria-label={ __( 'Next slide' ) }
				disabled={ ! hasNext }
				tabIndex={ -1 }
			>
				&rsaquo;
			</button>
			<span
				className="wp-block-slider__status screen-reader-text"
				aria-live="polite"
				aria-atomic="true"
			>
				{ slideStatus }
			</span>
		</div>
	);
}

export default function Edit( { attributes, clientId, setAttributes } ) {
	const {
		editorActiveSlideIndex,
		peekAmount = DEFAULT_PEEK_AMOUNT,
		peekUnit = DEFAULT_PEEK_UNIT,
		style,
	} = attributes;
	const { activeSlideIndex, slides } = useSliderSlides( clientId );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const { updateBlockAttributes, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );
	const slideCount = slides.length || SLIDER_TEMPLATE.length;
	const blockProps = useBlockProps( {
		className: clsx( {
			[ ZERO_PEEK_CLASS ]: isZeroPeek( peekAmount ),
		} ),
		style: getSliderStyle( { peekAmount, peekUnit, style } ),
	} );
	const innerBlocksProps = useInnerBlocksProps(
		{
			className: 'wp-block-slider__track',
		},
		{
			defaultBlock: { name: 'core/slide' },
			directInsert: true,
			template: SLIDER_TEMPLATE,
			templateInsertUpdatesSelection: true,
		}
	);

	useEffect( () => {
		if (
			slides.length > 0 &&
			activeSlideIndex !== editorActiveSlideIndex
		) {
			__unstableMarkNextChangeAsNotPersistent();
			updateBlockAttributes( clientId, {
				editorActiveSlideIndex: activeSlideIndex,
			} );
		}
	}, [
		activeSlideIndex,
		clientId,
		editorActiveSlideIndex,
		slides.length,
		updateBlockAttributes,
		__unstableMarkNextChangeAsNotPersistent,
	] );

	const onPeekUnitChange = ( nextUnit ) => {
		if ( ! nextUnit || nextUnit === peekUnit ) {
			return;
		}

		setAttributes( {
			peekUnit: nextUnit,
			peekAmount:
				nextUnit === '%'
					? Math.min( PERCENT_PEEK_AMOUNT, getPeekMax( nextUnit ) )
					: DEFAULT_PEEK_AMOUNT,
		} );
	};

	const onPeekAmountChange = ( nextAmount ) => {
		const normalizedAmount = Number.isFinite( nextAmount )
			? Math.max( 0, Math.min( nextAmount, getPeekMax( peekUnit ) ) )
			: 0;

		setAttributes( { peekAmount: normalizedAmount } );
	};

	return (
		<>
			<SliderControls sliderClientId={ clientId } />
			<InspectorControls>
				<ToolsPanel
					label={ __( 'Settings' ) }
					resetAll={ () =>
						setAttributes( {
							peekAmount: DEFAULT_PEEK_AMOUNT,
							peekUnit: DEFAULT_PEEK_UNIT,
						} )
					}
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						label={ __( 'Peek' ) }
						isShownByDefault
						hasValue={ () =>
							peekAmount !== DEFAULT_PEEK_AMOUNT ||
							peekUnit !== DEFAULT_PEEK_UNIT
						}
						onDeselect={ () =>
							setAttributes( {
								peekAmount: DEFAULT_PEEK_AMOUNT,
								peekUnit: DEFAULT_PEEK_UNIT,
							} )
						}
					>
						<ToggleGroupControl
							__next40pxDefaultSize
							isBlock
							label={ __( 'Peek unit' ) }
							value={ peekUnit }
							onChange={ onPeekUnitChange }
						>
							<ToggleGroupControlOption
								label={ __( 'Pixels' ) }
								value="px"
							/>
							<ToggleGroupControlOption
								label={ __( 'Percent' ) }
								value="%"
							/>
						</ToggleGroupControl>
						<RangeControl
							__next40pxDefaultSize
							label={ __( 'Peek' ) }
							min={ 0 }
							max={ getPeekMax( peekUnit ) }
							value={ peekAmount }
							onChange={ onPeekAmountChange }
							withInputField
						/>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>
			<div { ...blockProps }>
				<div className="wp-block-slider__viewport">
					<div { ...innerBlocksProps } />
				</div>
				<SliderEditorControls
					activeSlideIndex={ activeSlideIndex }
					slideCount={ slideCount }
				/>
			</div>
		</>
	);
}
