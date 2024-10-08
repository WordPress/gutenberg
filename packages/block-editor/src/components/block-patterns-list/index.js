/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { cloneBlock } from '@wordpress/blocks';
import { useEffect, useState, forwardRef, useMemo } from '@wordpress/element';
import {
	Composite,
	VisuallyHidden,
	Tooltip,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { Icon, symbol } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BlockPreview from '../block-preview';
import InserterDraggableBlocks from '../inserter-draggable-blocks';
import BlockPatternsPaging from '../block-patterns-paging';
import { INSERTER_PATTERN_TYPES } from '../inserter/block-patterns-tab/utils';

const WithToolTip = ( { showTooltip, title, children } ) => {
	if ( showTooltip ) {
		return <Tooltip text={ title }>{ children }</Tooltip>;
	}
	return <>{ children }</>;
};

function BlockPattern( {
	id,
	isDraggable,
	pattern,
	onClick,
	onHover,
	showTitle = true,
	showTooltip,
	category,
	isActive, // new prop to manage active state
	setActivePattern, // function to set the active pattern
} ) {
	const [ isDragging, setIsDragging ] = useState( false );
	const { blocks, viewportWidth } = pattern;
	const instanceId = useInstanceId( BlockPattern );
	const descriptionId = `block-editor-block-patterns-list__item-description-${ instanceId }`;

	// When we have a selected category and the pattern is draggable, we need to update the
	// pattern's categories in metadata to only contain the selected category, and pass this to
	// InserterDraggableBlocks component. We do that because we use this information for pattern
	// shuffling and it makes more sense to show only the ones from the initially selected category during insertion.
	const patternBlocks = useMemo( () => {
		if ( ! category || ! isDraggable ) {
			return blocks;
		}
		return ( blocks ?? [] ).map( ( block ) => {
			const clonedBlock = cloneBlock( block );
			if (
				clonedBlock.attributes.metadata?.categories?.includes(
					category
				)
			) {
				clonedBlock.attributes.metadata.categories = [ category ];
			}
			return clonedBlock;
		} );
	}, [ blocks, isDraggable, category ] );

	return (
		<InserterDraggableBlocks
			isEnabled={ isDraggable }
			blocks={ patternBlocks }
			pattern={ pattern }
		>
			{ ( { draggable, onDragStart, onDragEnd } ) => (
				<div
					className={ clsx(
						'block-editor-block-patterns-list__list-item',
						{ 'is-active': isActive } // Apply 'is-active' class if this pattern is active
					) }
					role="button" // Add role to make it behave like a button
					tabIndex={ 0 } // Make the element focusable by keyboard
					draggable={ draggable }
					onDragStart={ ( event ) => {
						setIsDragging( true );
						if ( onDragStart ) {
							onHover?.( null );
							onDragStart( event );
						}
					} }
					onDragEnd={ ( event ) => {
						setIsDragging( false );
						if ( onDragEnd ) {
							onDragEnd( event );
						}
					} }
					onClick={ () => {
						setActivePattern( id ); // Set active pattern when clicked
						onClick( pattern, blocks );
						onHover?.( null );
					} }
					onKeyDown={ ( event ) => {
						// Simulate button click with Enter or Space key press
						if ( event.key === 'Enter' || event.key === ' ' ) {
							event.preventDefault(); // Prevent default behavior for spacebar
							setActivePattern( id );
							onClick( pattern, blocks );
							onHover?.( null );
						}
					} }
				>
					<WithToolTip
						showTooltip={
							showTooltip &&
							! pattern.type !== INSERTER_PATTERN_TYPES.user
						}
						title={ pattern.title }
					>
						<Composite.Item
							render={
								<div
									role="option"
									aria-label={ pattern.title }
									aria-describedby={
										pattern.description
											? descriptionId
											: undefined
									}
									className={ clsx(
										'block-editor-block-patterns-list__item',
										{
											'block-editor-block-patterns-list__list-item-synced':
												pattern.type ===
													INSERTER_PATTERN_TYPES.user &&
												! pattern.syncStatus,
										}
									) }
								/>
							}
							id={ id }
							onClick={ () => {
								setActivePattern( id ); // Set active pattern when clicked
								onClick( pattern, blocks );
								onHover?.( null );
							} }
							onMouseEnter={ () => {
								if ( isDragging ) {
									return;
								}
								onHover?.( pattern );
							} }
							onMouseLeave={ () => onHover?.( null ) }
						>
							<BlockPreview
								blocks={ blocks }
								viewportWidth={ viewportWidth }
							/>

							{ showTitle && (
								<HStack
									className="block-editor-patterns__pattern-details"
									spacing={ 2 }
								>
									{ pattern.type ===
										INSERTER_PATTERN_TYPES.user &&
										! pattern.syncStatus && (
											<div className="block-editor-patterns__pattern-icon-wrapper">
												<Icon
													className="block-editor-patterns__pattern-icon"
													icon={ symbol }
												/>
											</div>
										) }
									{ ( ! showTooltip ||
										pattern.type ===
											INSERTER_PATTERN_TYPES.user ) && (
										<div className="block-editor-block-patterns-list__item-title">
											{ pattern.title }
										</div>
									) }
								</HStack>
							) }

							{ !! pattern.description && (
								<VisuallyHidden id={ descriptionId }>
									{ pattern.description }
								</VisuallyHidden>
							) }
						</Composite.Item>
					</WithToolTip>
				</div>
			) }
		</InserterDraggableBlocks>
	);
}

function BlockPatternPlaceholder() {
	return (
		<div className="block-editor-block-patterns-list__item is-placeholder" />
	);
}

function BlockPatternsList(
	{
		isDraggable,
		blockPatterns,
		shownPatterns,
		onHover,
		onClickPattern,
		orientation,
		label = __( 'Block patterns' ),
		category,
		showTitle = true,
		showTitlesAsTooltip,
		pagingProps,
	},
	ref
) {
	const [ activePattern, setActivePattern ] = useState( null ); // State to track active pattern

	useEffect( () => {
		// Reset the active composite item whenever the available patterns change,
		// to make sure that Composite widget can receive focus correctly when its
		// composite items change. The first composite item will receive focus.
		if ( typeof window !== 'undefined' && window.localStorage ) {
			// eslint-disable-next-line no-undef
			const storedPatternName = localStorage.getItem( 'savedPattern' );

			if (
				storedPatternName &&
				shownPatterns.some(
					( pattern ) => pattern.name === storedPatternName
				)
			) {
				// If there's a saved pattern and it exists in shownPatterns, set it as active
				setActivePattern( storedPatternName );
			} else {
				const firstCompositeItemId = blockPatterns.find( ( pattern ) =>
					shownPatterns.includes( pattern )
				)?.name;

				if ( firstCompositeItemId ) {
					setActivePattern( firstCompositeItemId );
				}
			}
		}
	}, [ shownPatterns, blockPatterns ] );
	const handleClickPattern = ( pattern ) => {
		// Check if we are in a browser environment and localStorage is available
		if ( typeof window !== 'undefined' && window.localStorage ) {
			// eslint-disable-next-line no-undef
			localStorage.setItem( 'savedPattern', pattern.name ); // Save the selected pattern in localStorage
		}
		setActivePattern( pattern.name ); // Set the clicked pattern as active
		onClickPattern( pattern ); // Original onClick logic
	};
	return (
		<Composite
			orientation={ orientation }
			activeId={ activePattern }
			setActiveId={ setActivePattern }
			role="listbox"
			className="block-editor-block-patterns-list"
			aria-label={ label }
			ref={ ref }
		>
			{ blockPatterns.map( ( pattern ) => {
				const isShown = shownPatterns.includes( pattern );
				return isShown ? (
					<BlockPattern
						key={ pattern.name }
						id={ pattern.name }
						pattern={ pattern }
						onClick={ handleClickPattern }
						onHover={ onHover }
						isDraggable={ isDraggable }
						showTitle={ showTitle }
						showTooltip={ showTitlesAsTooltip }
						category={ category }
						isActive={ activePattern === pattern.name } // Highlight the active pattern
						setActivePattern={ setActivePattern } // Function to set the active pattern
					/>
				) : (
					<BlockPatternPlaceholder key={ pattern.name } />
				);
			} ) }
			{ pagingProps && <BlockPatternsPaging { ...pagingProps } /> }
		</Composite>
	);
}

export default forwardRef( BlockPatternsList );
