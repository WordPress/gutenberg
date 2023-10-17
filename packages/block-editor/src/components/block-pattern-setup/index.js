/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { cloneBlock } from '@wordpress/blocks';
import {
	VisuallyHidden,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';

import { useState } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import BlockPreview from '../block-preview';
import SetupToolbar from './setup-toolbar';
import usePatternsSetup from './use-patterns-setup';
import { VIEWMODES } from './constants';
import { unlock } from '../../lock-unlock';

const {
	CompositeV2: Composite,
	CompositeItemV2: CompositeItem,
	useCompositeStoreV2: useCompositeStore,
} = unlock( componentsPrivateApis );

const SetupContent = ( {
	viewMode,
	activeSlide,
	patterns,
	onChangeSlide,
	onBlockPatternSelect,
	showTitles,
} ) => {
	const containerClass = 'block-editor-block-pattern-setup__container';
	const commonProps = { containerClass, patterns };

	return viewMode === VIEWMODES.carousel ? (
		<SetupContentAsCarousel
			{ ...commonProps }
			activeSlide={ activeSlide }
			onChangeSlide={ onChangeSlide }
		/>
	) : (
		<SetupContentAsGrid
			{ ...commonProps }
			onBlockPatternSelect={ onBlockPatternSelect }
			showTitles={ showTitles }
		/>
	);
};

function SetupContentAsCarousel( {
	containerClass,
	patterns,
	activeSlide,
	onChangeSlide,
} ) {
	const activeId = `block-editor-block-pattern-setup__carousel__${ patterns[ activeSlide ].name }__tab`;
	const composite = useCompositeStore( {
		defaultActiveId: activeId,
		orientation: 'horizontal',
	} );
	composite.setActiveId( activeId );
	const slideClass = new Map( [
		[ activeSlide, 'active-slide' ],
		[ activeSlide - 1, 'previous-slide' ],
		[ activeSlide + 1, 'next-slide' ],
	] );

	return (
		<div className="block-editor-block-pattern-setup__carousel">
			<div className={ containerClass }>
				<div className="carousel-container">
					<Composite store={ composite } role="tablist">
						<VisuallyHidden>
							{ patterns.map( ( pattern, index ) => (
								<CompositeItem
									key={ pattern.name }
									role="tab"
									id={ `block-editor-block-pattern-setup__carousel__${ pattern.name }__tab` }
									aria-controls={ `block-editor-block-pattern-setup__carousel__${ pattern.name }` }
									onClick={ () => onChangeSlide( index ) }
									onFocus={ () => onChangeSlide( index ) }
								>
									{ pattern.title }
								</CompositeItem>
							) ) }
						</VisuallyHidden>
					</Composite>
					{ patterns.map( ( pattern, index ) => (
						<BlockPatternSlide
							className={ slideClass.get( index ) || '' }
							key={ pattern.name }
							pattern={ pattern }
							id={ `block-editor-block-pattern-setup__carousel__${ pattern.name }` }
							aria-hidden={ activeSlide !== index }
						/>
					) ) }
				</div>
			</div>
		</div>
	);
}

function SetupContentAsGrid( {
	containerClass,
	patterns,
	onBlockPatternSelect,
	showTitles,
} ) {
	const composite = useCompositeStore( { orientation: 'vertical' } );

	return (
		<div className="block-editor-block-pattern-setup__grid">
			<Composite
				store={ composite }
				role="list"
				className={ containerClass }
				aria-label={ __( 'Patterns list' ) }
			>
				{ patterns.map( ( pattern ) => (
					<BlockPattern
						key={ pattern.name }
						pattern={ pattern }
						onSelect={ onBlockPatternSelect }
						showTitles={ showTitles }
					/>
				) ) }
			</Composite>
		</div>
	);
}

function BlockPattern( { pattern, onSelect, showTitles } ) {
	const baseClassName = 'block-editor-block-pattern-setup-list';
	const { blocks, description, viewportWidth = 700 } = pattern;
	const descriptionId = useInstanceId(
		BlockPattern,
		`${ baseClassName }__item-description`
	);
	return (
		<div className={ `${ baseClassName }__list-item` } role="listitem">
			<CompositeItem
				role="button"
				render={ <div /> }
				className={ `${ baseClassName }__item` }
				onClick={ () => onSelect( blocks ) }
			>
				<div
					role="img"
					aria-label={ pattern.title }
					aria-describedby={
						pattern.description ? descriptionId : undefined
					}
				>
					<BlockPreview
						blocks={ blocks }
						viewportWidth={ viewportWidth }
					/>
					{ showTitles && (
						<div className={ `${ baseClassName }__item-title` }>
							{ pattern.title }
						</div>
					) }
					{ !! description && (
						<VisuallyHidden id={ descriptionId }>
							{ description }
						</VisuallyHidden>
					) }
				</div>
			</CompositeItem>
		</div>
	);
}

function BlockPatternSlide( {
	className,
	pattern,
	minHeight,
	...additionalProps
} ) {
	const { blocks, title, description } = pattern;
	const descriptionId = useInstanceId(
		BlockPatternSlide,
		'block-editor-block-pattern-setup-list__item-description'
	);
	return (
		<div
			{ ...additionalProps }
			className={ `pattern-slide ${ className }` }
			role="tabpanel"
		>
			<div
				role="img"
				aria-label={ title }
				aria-describedby={ description ? descriptionId : undefined }
			>
				<BlockPreview blocks={ blocks } minHeight={ minHeight } />
				{ !! description && (
					<VisuallyHidden id={ descriptionId }>
						{ description }
					</VisuallyHidden>
				) }
			</div>
		</div>
	);
}

const BlockPatternSetup = ( {
	clientId,
	blockName,
	filterPatternsFn,
	onBlockPatternSelect,
	initialViewMode = VIEWMODES.carousel,
	showTitles = false,
} ) => {
	const [ viewMode, setViewMode ] = useState( initialViewMode );
	const [ activeSlide, setActiveSlide ] = useState( 0 );
	const { replaceBlock } = useDispatch( blockEditorStore );
	const patterns = usePatternsSetup( clientId, blockName, filterPatternsFn );

	if ( ! patterns?.length ) {
		return null;
	}

	const onBlockPatternSelectDefault = ( blocks ) => {
		const clonedBlocks = blocks.map( ( block ) => cloneBlock( block ) );
		replaceBlock( clientId, clonedBlocks );
	};
	const onPatternSelectCallback =
		onBlockPatternSelect || onBlockPatternSelectDefault;
	return (
		<>
			<div
				className={ `block-editor-block-pattern-setup view-mode-${ viewMode }` }
			>
				<SetupContent
					viewMode={ viewMode }
					activeSlide={ activeSlide }
					patterns={ patterns }
					onBlockPatternSelect={ onPatternSelectCallback }
					onChangeSlide={ ( newSlide ) => {
						setActiveSlide(
							Math.min(
								Math.max( newSlide, 0 ),
								patterns.length - 1
							)
						);
					} }
					showTitles={ showTitles }
				/>
				<SetupToolbar
					viewMode={ viewMode }
					setViewMode={ setViewMode }
					activeSlide={ activeSlide }
					totalSlides={ patterns.length }
					handleNext={ () => {
						setActiveSlide( ( active ) =>
							Math.min( active + 1, patterns.length - 1 )
						);
					} }
					handlePrevious={ () => {
						setActiveSlide( ( active ) =>
							Math.max( active - 1, 0 )
						);
					} }
					onBlockPatternSelect={ () => {
						onPatternSelectCallback(
							patterns[ activeSlide ].blocks
						);
					} }
				/>
			</div>
		</>
	);
};

export default BlockPatternSetup;
