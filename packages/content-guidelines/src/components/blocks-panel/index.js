/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useMemo, useEffect } from '@wordpress/element';
import {
	Button,
	SearchControl,
	Navigator,
	useNavigator,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	__experimentalText as Text,
	__experimentalHeading as Heading,
	__experimentalSpacer as Spacer,
	Flex,
	FlexItem,
	TextareaControl,
	Spinner,
} from '@wordpress/components';
import { store as blocksStore } from '@wordpress/blocks';
import { store as coreStore } from '@wordpress/core-data';
import { chevronRight, chevronLeft } from '@wordpress/icons';
import { isRTL } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { STORE_NAME } from '../../store';
import RepeaterControl from '../controls/repeater-control';
import './style.scss';

/**
 * Common block types that benefit from guidelines.
 */
const PRIORITY_BLOCKS = [
	'core/paragraph',
	'core/heading',
	'core/button',
	'core/image',
	'core/list',
	'core/quote',
];

/**
 * Number of blocks to show per page.
 */
const BLOCKS_PER_PAGE = 20;

/**
 * Block card component.
 *
 * @param {Object}   props              Component props.
 * @param {Object}   props.block        Block type object.
 * @param {string}   props.variantsText Status text.
 * @param {Function} props.onClick      Click handler.
 * @param {string}   props.navigatorPath Navigator path.
 * @return {JSX.Element} Block card.
 */
function BlockCard( { block, variantsText, onClick, navigatorPath } ) {
	const navigator = useNavigator();
	const { title, icon } = block;

	const handleClick = () => {
		if ( onClick ) {
			onClick();
		}
		if ( navigatorPath ) {
			navigator.goTo( navigatorPath );
		}
	};

	return (
		<Button
			__next40pxDefaultSize
			className="blocks-panel__block-card"
			onClick={ handleClick }
		>
			<Flex justify="space-between">
				<FlexItem>
					<Text className="blocks-panel__block-title">
						{ title }
					</Text>
				</FlexItem>
				<Flex justify="flex-end" gap={ 2 }>
					{ variantsText && (
						<FlexItem>
							<Text className="blocks-panel__block-status" variant="muted">
								{ variantsText }
							</Text>
						</FlexItem>
					) }
					<FlexItem>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							width="24"
							height="24"
							aria-hidden="true"
							focusable="false"
						>
							<path d="M10.6 6L9.4 7l4.6 5-4.6 5 1.2 1 5.4-6z" />
						</svg>
					</FlexItem>
				</Flex>
			</Flex>
		</Button>
	);
}

/**
 * Block detail screen component.
 *
 * @param {Object} props           Component props.
 * @param {Object} props.block     Selected block.
 * @param {Function} props.onBack  Back handler.
 * @return {JSX.Element} Block detail screen.
 */
function BlockDetailScreen( { block, onBack } ) {
	const { blockGuidelines } = useSelect( ( select ) => {
		const draft = select( STORE_NAME ).getDraft();
		return {
			blockGuidelines: draft?.blocks?.[ block?.name ] || {},
		};
	}, [ block?.name ] );

	const { updateBlockGuidelines } = useDispatch( STORE_NAME );

	const updateNestedField = ( parent, field, value ) => {
		updateBlockGuidelines( block.name, {
			...blockGuidelines,
			[ parent ]: {
				...( blockGuidelines[ parent ] || {} ),
				[ field ]: value,
			},
		} );
	};

	const updateField = ( field, value ) => {
		updateBlockGuidelines( block.name, {
			...blockGuidelines,
			[ field ]: value,
		} );
	};

	const handleClear = () => {
		updateBlockGuidelines( block.name, {
			copy_rules: { dos: [], donts: [] },
			notes: '',
		} );
	};

	if ( ! block ) {
		return null;
	}

	// Render block icon from REST API data
	const renderBlockIcon = () => {
		if ( ! block.icon ) {
			return null;
		}

		// Icon can be a string (dashicon), an object with src (SVG), or an SVG string
		if ( typeof block.icon === 'string' ) {
			if ( block.icon.startsWith( '<svg' ) ) {
				return (
					<span
						className="blocks-panel__block-icon"
						dangerouslySetInnerHTML={ { __html: block.icon } }
					/>
				);
			}
			// Dashicon
			return <span className={ `dashicons dashicons-${ block.icon } blocks-panel__block-icon` } />;
		}

		if ( block.icon?.src ) {
			if ( typeof block.icon.src === 'string' && block.icon.src.startsWith( '<svg' ) ) {
				return (
					<span
						className="blocks-panel__block-icon"
						dangerouslySetInnerHTML={ { __html: block.icon.src } }
					/>
				);
			}
		}

		return null;
	};

	return (
		<div className="blocks-panel__detail-container">
			<div className="blocks-panel__detail-header">
				<Navigator.BackButton
					icon={ isRTL() ? chevronRight : chevronLeft }
					size="small"
					onClick={ onBack }
					label={ __( 'Back', 'content-guidelines' ) }
				/>
				<Heading
					level={ 2 }
					size={ 13 }
					className="blocks-panel__detail-title"
				>
					{ block.title }
				</Heading>
				<Button
					variant="tertiary"
					isDestructive
					size="small"
					onClick={ handleClear }
				>
					{ __( 'Clear', 'content-guidelines' ) }
				</Button>
			</div>

			<Spacer margin={ 4 } />

			<div className="blocks-panel__block-preview">
				{ renderBlockIcon() }
				<div className="blocks-panel__block-info">
					<Text className="blocks-panel__block-name">{ block.name }</Text>
					{ block.description && (
						<Text variant="muted" className="blocks-panel__block-description">
							{ block.description }
						</Text>
					) }
				</div>
			</div>

			<Spacer margin={ 4 } />

			<VStack spacing={ 4 }>
				<div className="blocks-panel__divider">
					<span className="blocks-panel__divider-text">
						{ __( 'Copy Rules', 'content-guidelines' ) }
					</span>
				</div>

				<RepeaterControl
					label={ __( 'Do', 'content-guidelines' ) }
					items={ blockGuidelines.copy_rules?.dos || [] }
					onChange={ ( value ) => updateNestedField( 'copy_rules', 'dos', value ) }
					placeholder={ __( 'Add a rule…', 'content-guidelines' ) }
				/>
				<RepeaterControl
					label={ __( "Don't", 'content-guidelines' ) }
					items={ blockGuidelines.copy_rules?.donts || [] }
					onChange={ ( value ) => updateNestedField( 'copy_rules', 'donts', value ) }
					placeholder={ __( 'Add a rule…', 'content-guidelines' ) }
				/>

				<div className="blocks-panel__divider">
					<span className="blocks-panel__divider-text">
						{ __( 'Notes', 'content-guidelines' ) }
					</span>
				</div>

				<TextareaControl
					__nextHasNoMarginBottom
					value={ blockGuidelines.notes || '' }
					onChange={ ( value ) => updateField( 'notes', value ) }
					placeholder={ __( 'Any other guidelines for this block…', 'content-guidelines' ) }
					rows={ 3 }
				/>
			</VStack>
		</div>
	);
}

/**
 * Blocks panel component with Navigator drill-down.
 *
 * @param {Object}   props               Component props.
 * @param {string}   props.initialBlock  Initial block name from URL.
 * @param {Function} props.onBlockChange Callback when block changes.
 * @return {JSX.Element} Blocks panel.
 */
export default function BlocksPanel( { initialBlock, onBlockChange } ) {
	const [ searchTerm, setSearchTerm ] = useState( '' );
	const [ selectedBlock, setSelectedBlock ] = useState( null );
	const [ pendingBlockName, setPendingBlockName ] = useState( initialBlock );
	const [ blockTypes, setBlockTypes ] = useState( [] );
	const [ isLoading, setIsLoading ] = useState( true );
	const [ error, setError ] = useState( null );
	const [ currentPage, setCurrentPage ] = useState( 1 );

	// Fetch block types from REST API on mount.
	// This works on any admin page, unlike the blocks store which
	// only has blocks when the block editor is loaded.
	useEffect( () => {
		let isMounted = true;

		async function fetchBlockTypes() {
			try {
				setIsLoading( true );
				setError( null );

				// Fetch all block types from the REST API.
				const response = await apiFetch( {
					path: '/wp/v2/block-types?per_page=100',
				} );

				if ( isMounted ) {
					// Transform REST API response to match blocks store format.
					const blocks = response.map( ( block ) => ( {
						name: block.name,
						title: block.title || block.name,
						description: block.description || '',
						category: block.category || 'common',
						icon: block.icon || null,
						keywords: block.keywords || [],
					} ) );

					setBlockTypes( blocks );
					setIsLoading( false );
				}
			} catch ( err ) {
				if ( isMounted ) {
					setError( err.message || __( 'Failed to load blocks.', 'content-guidelines' ) );
					setIsLoading( false );
				}
			}
		}

		fetchBlockTypes();

		return () => {
			isMounted = false;
		};
	}, [] );

	// Set selected block from URL after blocks are loaded.
	useEffect( () => {
		if ( pendingBlockName && blockTypes.length > 0 && ! selectedBlock ) {
			const found = blockTypes.find( ( b ) => b.name === pendingBlockName );
			if ( found ) {
				setSelectedBlock( found );
			}
			setPendingBlockName( null );
		}
	}, [ pendingBlockName, blockTypes, selectedBlock ] );

	// Handle block selection with URL callback.
	const handleBlockSelect = ( block ) => {
		setSelectedBlock( block );
		if ( onBlockChange ) {
			onBlockChange( block.name );
		}
	};

	// Handle back navigation with URL callback.
	const handleBack = () => {
		setSelectedBlock( null );
		if ( onBlockChange ) {
			onBlockChange( null );
		}
	};

	const { blockGuidelines } = useSelect( ( select ) => {
		const draft = select( STORE_NAME ).getDraft();
		return {
			blockGuidelines: draft?.blocks || {},
		};
	}, [] );

	// Filter and sort blocks
	const filteredBlocks = useMemo( () => {
		let blocks = blockTypes.filter( ( block ) => {
			if ( block.name.startsWith( 'core/legacy-' ) ) {
				return false;
			}
			if ( searchTerm ) {
				const search = searchTerm.toLowerCase();
				return (
					block.title.toLowerCase().includes( search ) ||
					block.name.toLowerCase().includes( search )
				);
			}
			return true;
		} );

		blocks.sort( ( a, b ) => {
			const aPriority = PRIORITY_BLOCKS.indexOf( a.name );
			const bPriority = PRIORITY_BLOCKS.indexOf( b.name );
			if ( aPriority !== -1 && bPriority !== -1 ) return aPriority - bPriority;
			if ( aPriority !== -1 ) return -1;
			if ( bPriority !== -1 ) return 1;
			return a.title.localeCompare( b.title );
		} );

		return blocks;
	}, [ blockTypes, searchTerm ] );

	// Reset page when search changes
	useEffect( () => {
		setCurrentPage( 1 );
	}, [ searchTerm ] );

	const { priorityBlocks, otherBlocks, paginatedOtherBlocks, totalPages } = useMemo( () => {
		const priority = [];
		const other = [];
		filteredBlocks.forEach( ( block ) => {
			if ( PRIORITY_BLOCKS.includes( block.name ) ) {
				priority.push( block );
			} else {
				other.push( block );
			}
		} );

		// Paginate "other" blocks only (priority blocks always show)
		const startIndex = ( currentPage - 1 ) * BLOCKS_PER_PAGE;
		const endIndex = startIndex + BLOCKS_PER_PAGE;
		const paginated = other.slice( startIndex, endIndex );
		const pages = Math.ceil( other.length / BLOCKS_PER_PAGE );

		return {
			priorityBlocks: priority,
			otherBlocks: other,
			paginatedOtherBlocks: paginated,
			totalPages: pages,
		};
	}, [ filteredBlocks, currentPage ] );

	/**
	 * Check if a block has meaningful guidelines configured.
	 *
	 * @param {string} blockName Block name.
	 * @return {string|null} Status text or null.
	 */
	const getBlockStatus = ( blockName ) => {
		const guidelines = blockGuidelines[ blockName ];
		if ( ! guidelines ) {
			return null;
		}

		// Check if there's any actual content
		const hasCopyRules =
			( guidelines.copy_rules?.dos?.length > 0 ) ||
			( guidelines.copy_rules?.donts?.length > 0 );
		const hasNotes = guidelines.notes && guidelines.notes.trim().length > 0;

		if ( hasCopyRules || hasNotes ) {
			return __( 'Configured', 'content-guidelines' );
		}

		return null;
	};

	// Show loading state.
	if ( isLoading ) {
		return (
			<div className="blocks-panel">
				<div className="blocks-panel__loading">
					<Spinner />
					<Text variant="muted">
						{ __( 'Loading blocks…', 'content-guidelines' ) }
					</Text>
				</div>
			</div>
		);
	}

	// Show error state.
	if ( error ) {
		return (
			<div className="blocks-panel">
				<div className="blocks-panel__loading">
					<Text className="blocks-panel__error">
						{ error }
					</Text>
					<Button
						variant="secondary"
						onClick={ () => window.location.reload() }
					>
						{ __( 'Retry', 'content-guidelines' ) }
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="blocks-panel">
			<Navigator initialPath={ selectedBlock ? '/block' : '/' }>
				<Navigator.Screen path="/">
					<div className="blocks-panel__content">
						<div className="blocks-panel__search">
							<SearchControl
								__nextHasNoMarginBottom
								value={ searchTerm }
								onChange={ setSearchTerm }
								placeholder={ __( 'Search blocks…', 'content-guidelines' ) }
							/>
						</div>

						{ priorityBlocks.length > 0 && (
							<div className="blocks-panel__section">
								<h2 className="blocks-panel__list-title">
									{ __( 'Common', 'content-guidelines' ) }
								</h2>
								<ul role="list" className="blocks-panel__list">
									{ priorityBlocks.map( ( block ) => (
										<li key={ block.name } className="blocks-panel__list-item">
											<BlockCard
												block={ block }
												variantsText={ getBlockStatus( block.name ) }
												navigatorPath="/block"
												onClick={ () => handleBlockSelect( block ) }
											/>
										</li>
									) ) }
								</ul>
							</div>
						) }

						{ otherBlocks.length > 0 && (
							<div className="blocks-panel__section">
								<h2 className="blocks-panel__list-title">
									{ __( 'All Blocks', 'content-guidelines' ) }
									<span className="blocks-panel__list-count">
										{ otherBlocks.length }
									</span>
								</h2>
								<ul role="list" className="blocks-panel__list">
									{ paginatedOtherBlocks.map( ( block ) => (
										<li key={ block.name } className="blocks-panel__list-item">
											<BlockCard
												block={ block }
												variantsText={ getBlockStatus( block.name ) }
												navigatorPath="/block"
												onClick={ () => handleBlockSelect( block ) }
											/>
										</li>
									) ) }
								</ul>
								{ totalPages > 1 && (
									<div className="blocks-panel__pagination">
										<Button
											variant="secondary"
											size="small"
											disabled={ currentPage === 1 }
											onClick={ () => setCurrentPage( currentPage - 1 ) }
										>
											{ __( 'Previous', 'content-guidelines' ) }
										</Button>
										<span className="blocks-panel__pagination-info">
											{ currentPage } / { totalPages }
										</span>
										<Button
											variant="secondary"
											size="small"
											disabled={ currentPage === totalPages }
											onClick={ () => setCurrentPage( currentPage + 1 ) }
										>
											{ __( 'Next', 'content-guidelines' ) }
										</Button>
									</div>
								) }
							</div>
						) }

						{ filteredBlocks.length === 0 && (
							<Text variant="muted" className="blocks-panel__empty">
								{ __( 'No blocks found.', 'content-guidelines' ) }
							</Text>
						) }
					</div>
				</Navigator.Screen>

				<Navigator.Screen path="/block">
					<BlockDetailScreen
						block={ selectedBlock }
						onBack={ handleBack }
					/>
				</Navigator.Screen>
			</Navigator>
		</div>
	);
}
