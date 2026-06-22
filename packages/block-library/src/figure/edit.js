/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	useInnerBlocksProps,
	BlockControls,
	store as blockEditorStore,
	__experimentalBlockVariationPicker as BlockVariationPicker,
} from '@wordpress/block-editor';
import {
	ToolbarGroup,
	ToolbarButton,
	Placeholder,
	Button,
	Flex,
	FlexItem,
} from '@wordpress/components';
import { caption as captionIcon } from '@wordpress/icons';
import { useState, useEffect, useRef } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	createBlock,
	createBlocksFromInnerBlocksTemplate,
	store as blocksStore,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { Caption } from '../utils/caption';
import {
	captionTopIcon,
	captionBottomIcon,
	default as figureIcon,
} from './icon';

export default function FigureEdit( {
	attributes,
	setAttributes,
	isSelected,
	insertBlocksAfter,
	clientId,
} ) {
	const { captionPosition, textAlign, showFigureNumber } = attributes;

	const [ setupView, setSetupView ] = useState( 'start' );

	const blockVariations = useSelect(
		( select ) =>
			select( blocksStore ).getBlockVariations( 'core/figure', 'block' ),
		[]
	);

	const innerBlocks = useSelect(
		( select ) =>
			select( blockEditorStore ).getBlock( clientId )?.innerBlocks || [],
		[ clientId ]
	);
	const hasInnerBlocks = innerBlocks.length > 0;
	const { replaceInnerBlocks } = useDispatch( blockEditorStore );

	const startBlank = () => {
		setAttributes( { layout: { type: 'default' } } );
		replaceInnerBlocks( clientId, [ createBlock( 'core/paragraph' ) ] );
	};

	const figureRef = useRef();
	const [ isCaptionRendered, setIsCaptionRendered ] = useState(
		!! attributes.caption
	);

	useEffect( () => {
		if ( ! figureRef.current ) {
			return;
		}

		setIsCaptionRendered(
			!! figureRef.current.querySelector( 'figcaption' )
		);

		const observer = new window.MutationObserver( () => {
			const hasCaption =
				!! figureRef.current.querySelector( 'figcaption' );
			setIsCaptionRendered( hasCaption );
		} );

		observer.observe( figureRef.current, {
			childList: true,
			subtree: false,
		} );

		return () => observer.disconnect();
	}, [] );

	const isCaptionTop = captionPosition === 'top';

	const blockProps = useBlockProps( {
		className: clsx( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
			[ `is-caption-${ captionPosition }` ]: true,
			'has-figure-number': showFigureNumber,
		} ),
	} );

	const mergedRef = useMergeRefs( [ blockProps.ref, figureRef ] );

	const renderSetupAppender = () => {
		if ( setupView === 'layouts' ) {
			return (
				<BlockVariationPicker
					icon={ figureIcon }
					label={ __( 'Choose a layout' ) }
					instructions={ __( 'Select a variation to start with:' ) }
					variations={ blockVariations }
					onSelect={ ( variation ) => {
						if ( variation.attributes ) {
							setAttributes( variation.attributes );
						}
						if ( variation.innerBlocks ) {
							replaceInnerBlocks(
								clientId,
								createBlocksFromInnerBlocksTemplate(
									variation.innerBlocks
								),
								false
							);
						}
					} }
				/>
			);
		}

		return (
			<Placeholder
				icon={ figureIcon }
				label={ __( 'Figure' ) }
				instructions={ __( 'Select a variation or start blank:' ) }
			>
				<Flex justify="flex-start" gap={ 3 }>
					<FlexItem>
						<Button
							variant="primary"
							onClick={ () => setSetupView( 'layouts' ) }
							__next40pxDefaultSize
						>
							{ __( 'Choose a variation' ) }
						</Button>
					</FlexItem>
					<FlexItem>
						<Button
							variant="secondary"
							onClick={ startBlank }
							__next40pxDefaultSize
						>
							{ __( 'Start blank' ) }
						</Button>
					</FlexItem>
				</Flex>
			</Placeholder>
		);
	};

	const innerBlocksProps = useInnerBlocksProps(
		{ className: 'wp-block-figure__content' },
		{
			renderAppender: hasInnerBlocks ? undefined : renderSetupAppender,
		}
	);

	return (
		<>
			<BlockControls group="block">
				<ToolbarGroup>
					<ToolbarButton
						disabled={ ! isCaptionRendered }
						icon={
							isCaptionTop ? captionTopIcon : captionBottomIcon
						}
						label={
							isCaptionTop
								? __( 'Move caption to bottom' )
								: __( 'Move caption to top' )
						}
						className={ typeof attributes.caption }
						onClick={ () =>
							setAttributes( {
								captionPosition: isCaptionTop
									? 'bottom'
									: 'top',
							} )
						}
					/>
				</ToolbarGroup>
			</BlockControls>

			<figure { ...blockProps } ref={ mergedRef }>
				<div { ...innerBlocksProps } />
				{ hasInnerBlocks && (
					<Caption
						attributeKey="caption"
						tagName="figcaption"
						className="wp-element-caption"
						isSelected={ isSelected }
						attributes={ attributes }
						setAttributes={ setAttributes }
						icon={ captionIcon }
						label={ __( 'Figure caption text' ) }
						placeholder={ __( 'Add caption…' ) }
						addLabel={ __( 'Add caption' ) }
						removeLabel={ __( 'Remove caption' ) }
						insertBlocksAfter={ insertBlocksAfter }
					/>
				) }
			</figure>
		</>
	);
}
