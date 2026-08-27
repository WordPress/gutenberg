import clsx from 'clsx';
import { Button, Disabled, Composite } from '@wordpress/components';
import { __, _n, _x, sprintf } from '@wordpress/i18n';
import { comment as commentIcon } from '@wordpress/icons';
import {
	BlockList,
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
	useSettings,
	BlockEditorProvider,
	__unstableEditorStyles as EditorStyles,
	__unstableIframe as Iframe,
	__experimentalUseMultipleOriginColorsAndGradients as useMultipleOriginColorsAndGradients,
} from '@wordpress/block-editor';
import { useSelect, dispatch } from '@wordpress/data';
import { mergeGlobalStyles } from '@wordpress/global-styles-engine';
import {
	useMemo,
	useState,
	memo,
	useRef,
	useLayoutEffect,
	useEffect,
	forwardRef,
} from '@wordpress/element';
import { ENTER, SPACE } from '@wordpress/keycodes';
import { uploadMedia } from '@wordpress/media-utils';
import { store as coreStore } from '@wordpress/core-data';
import { Tabs } from '@wordpress/ui';
import { unlock } from '../../lock-unlock';
import { STYLE_BOOK_IFRAME_STYLES } from './constants';
import {
	getExamplesByCategory,
	getTopLevelStyleBookCategories,
} from './categories';
import { getExamples } from './examples';
import { GlobalStylesRenderer } from '../global-styles-renderer';
import {
	STYLE_BOOK_COLOR_GROUPS,
	STYLE_BOOK_PREVIEW_CATEGORIES,
} from '../style-book/constants';
import { useGlobalStylesOutputWithConfig } from '../../hooks/use-global-styles-output';
import { useStyle, useGlobalStyles } from '../global-styles';
import { store as editorStore } from '../../store';

const { ExperimentalBlockEditorProvider } = unlock( blockEditorPrivateApis );

function isObjectEmpty( object ) {
	return ! object || Object.keys( object ).length === 0;
}

/**
 * Scrolls to a section within an iframe.
 *
 * @param {string}            anchorId The id of the element to scroll to.
 * @param {HTMLIFrameElement} iframe   The target iframe.
 */
const scrollToSection = ( anchorId, iframe ) => {
	if ( ! anchorId || ! iframe || ! iframe?.contentDocument ) {
		return;
	}

	const element =
		anchorId === 'top'
			? iframe.contentDocument.body
			: iframe.contentDocument.getElementById( anchorId );
	if ( element ) {
		element.scrollIntoView( {
			behavior: 'smooth',
		} );
	}
};

/**
 * Parses a Block Editor navigation path to build a style book navigation path.
 * The object can be extended to include a category, representing a style book tab/section.
 *
 * @param {string} path An internal Block Editor navigation path.
 * @return {null|{block: string}} An object containing the example to navigate to.
 */
const getStyleBookNavigationFromPath = ( path ) => {
	if ( path && typeof path === 'string' ) {
		if (
			path === '/' ||
			path.startsWith( '/typography' ) ||
			path.startsWith( '/colors' ) ||
			path.startsWith( '/blocks' )
		) {
			return {
				top: true,
			};
		}
	}
	return null;
};

/**
 * Retrieves colors, gradients, and duotone filters from Global Styles.
 * The inclusion of default (Core) palettes is controlled by the relevant
 * theme.json property e.g. defaultPalette, defaultGradients, defaultDuotone.
 *
 * @return {Object} Object containing properties for each type of palette.
 */
export function useMultiOriginPalettes() {
	const { colors, gradients } = useMultipleOriginColorsAndGradients();

	// Add duotone filters to the palettes data.
	const [
		shouldDisplayDefaultDuotones,
		customDuotones,
		themeDuotones,
		defaultDuotones,
	] = useSettings(
		'color.defaultDuotone',
		'color.duotone.custom',
		'color.duotone.theme',
		'color.duotone.default'
	);

	const palettes = useMemo( () => {
		const result = { colors, gradients, duotones: [] };

		if ( themeDuotones && themeDuotones.length ) {
			result.duotones.push( {
				name: _x(
					'Theme',
					'Indicates these duotone filters come from the theme.'
				),
				slug: 'theme',
				duotones: themeDuotones,
			} );
		}

		if (
			shouldDisplayDefaultDuotones &&
			defaultDuotones &&
			defaultDuotones.length
		) {
			result.duotones.push( {
				name: _x(
					'Default',
					'Indicates these duotone filters come from WordPress.'
				),
				slug: 'default',
				duotones: defaultDuotones,
			} );
		}
		if ( customDuotones && customDuotones.length ) {
			result.duotones.push( {
				name: _x(
					'Custom',
					'Indicates these doutone filters are created by the user.'
				),
				slug: 'custom',
				duotones: customDuotones,
			} );
		}

		return result;
	}, [
		colors,
		gradients,
		customDuotones,
		themeDuotones,
		defaultDuotones,
		shouldDisplayDefaultDuotones,
	] );

	return palettes;
}

/**
 * Get deduped examples for single page stylebook.
 * @param {Array} examples Array of examples.
 * @return {Array} Deduped examples.
 */
export function getExamplesForSinglePageUse( examples ) {
	const examplesForSinglePageUse = [];
	const overviewCategoryExamples = getExamplesByCategory(
		{ slug: 'overview' },
		examples
	);
	examplesForSinglePageUse.push( ...overviewCategoryExamples.examples );
	const otherExamples = examples.filter( ( example ) => {
		return (
			example.category !== 'overview' &&
			! overviewCategoryExamples.examples.find(
				( overviewExample ) => overviewExample.name === example.name
			)
		);
	} );
	examplesForSinglePageUse.push( ...otherExamples );

	return examplesForSinglePageUse;
}

/**
 * Applies a block variation to each example by updating its attributes.
 *
 * @param {Array}  examples  Array of examples
 * @param {string} variation Block variation name.
 * @return {Array} Updated examples with variation applied.
 */
function applyBlockVariationsToExamples( examples, variation ) {
	if ( ! variation ) {
		return examples;
	}
	return examples.map( ( example ) => {
		return {
			...example,
			variation,
			blocks: Array.isArray( example.blocks )
				? example.blocks.map( ( block ) => ( {
						...block,
						attributes: {
							...block.attributes,
							style: undefined,
							className: `is-style-${ variation }`,
						},
				  } ) )
				: {
						...example.blocks,
						attributes: {
							...example.blocks.attributes,
							style: undefined,
							className: `is-style-${ variation }`,
						},
				  },
		};
	} );
}

function StyleBook(
	{
		isSelected,
		onClick,
		onSelect,
		showTabs = true,
		userConfig = {},
		path = '',
		noteActions,
		highlightedAnchor,
	},
	ref
) {
	const textColor = useStyle( 'color.text' );
	const backgroundColor = useStyle( 'color.background' );
	const colors = useMultiOriginPalettes();
	const examples = useMemo( () => getExamples( colors ), [ colors ] );
	const tabs = useMemo(
		() =>
			getTopLevelStyleBookCategories().filter( ( category ) =>
				examples.some(
					( example ) => example.category === category.slug
				)
			),
		[ examples ]
	);

	const examplesForSinglePageUse = getExamplesForSinglePageUse( examples );

	const { base: baseConfig } = useGlobalStyles();
	const goTo = getStyleBookNavigationFromPath( path );

	const mergedConfig = useMemo( () => {
		if ( ! isObjectEmpty( userConfig ) && ! isObjectEmpty( baseConfig ) ) {
			return mergeGlobalStyles( baseConfig, userConfig );
		}
		return {};
	}, [ baseConfig, userConfig ] );

	const originalSettings = useSelect(
		( select ) => select( blockEditorStore ).getSettings(),
		[]
	);
	const [ globalStyles ] = useGlobalStylesOutputWithConfig( mergedConfig );

	const settings = useMemo(
		() => ( {
			...originalSettings,
			styles:
				! isObjectEmpty( globalStyles ) && ! isObjectEmpty( userConfig )
					? globalStyles
					: originalSettings.styles,
			isPreviewMode: true,
		} ),
		[ globalStyles, originalSettings, userConfig ]
	);

	return (
		<div
			ref={ ref }
			className={ clsx( 'editor-style-book', {
				'is-button': !! onClick,
			} ) }
			style={ {
				color: textColor,
				background: backgroundColor,
			} }
		>
			{ showTabs ? (
				<Tabs.Root
					className="editor-style-book__tabs"
					defaultValue={ tabs[ 0 ]?.slug }
				>
					<div className="editor-style-book__tablist-container">
						<Tabs.List>
							{ tabs.map( ( tab ) => (
								<Tabs.Tab value={ tab.slug } key={ tab.slug }>
									{ tab.title }
								</Tabs.Tab>
							) ) }
						</Tabs.List>
					</div>
					{ tabs.map( ( tab ) => {
						const categoryDefinition = tab.slug
							? getTopLevelStyleBookCategories().find(
									( _category ) => _category.slug === tab.slug
							  )
							: null;
						const filteredExamples = categoryDefinition
							? getExamplesByCategory(
									categoryDefinition,
									examples
							  )
							: { examples };
						return (
							<Tabs.Panel
								key={ tab.slug }
								value={ tab.slug }
								tabIndex={ -1 }
								className="editor-style-book__tabpanel"
							>
								<StyleBookBody
									category={ tab.slug }
									examples={ filteredExamples }
									isSelected={ isSelected }
									onSelect={ onSelect }
									settings={ settings }
									title={ tab.title }
									goTo={ goTo }
									noteActions={ noteActions }
									highlightedAnchor={ highlightedAnchor }
								/>
							</Tabs.Panel>
						);
					} ) }
				</Tabs.Root>
			) : (
				<StyleBookBody
					examples={ { examples: examplesForSinglePageUse } }
					isSelected={ isSelected }
					onClick={ onClick }
					onSelect={ onSelect }
					settings={ settings }
					goTo={ goTo }
					noteActions={ noteActions }
					highlightedAnchor={ highlightedAnchor }
				/>
			) }
		</div>
	);
}

/**
 * Style Book Preview component renders the stylebook without the Editor dependency.
 *
 * @param {Object}   props              Component props.
 * @param {string}   props.path         Current path in global styles.
 * @param {Function} props.onPathChange Callback when the path changes.
 * @param {Object}   props.userConfig   User configuration.
 * @param {boolean}  props.isStatic     Whether the stylebook is static or clickable.
 * @param {Object}   props.settings     Optional editor settings to use instead of the editor store settings.
 * @return {Object} Style Book Preview component.
 */
export const StyleBookPreview = ( {
	userConfig = {},
	isStatic = false,
	path,
	onPathChange,
	settings: settingsProp,
} ) => {
	const editorSettings = useSelect(
		( select ) => settingsProp ?? select( editorStore ).getEditorSettings(),
		[ settingsProp ]
	);

	const canUserUploadMedia = useSelect(
		( select ) =>
			select( coreStore ).canUser( 'create', {
				kind: 'postType',
				name: 'attachment',
			} ),
		[]
	);

	// Update block editor settings because useMultipleOriginColorsAndGradients fetch colours from there.
	useEffect( () => {
		dispatch( blockEditorStore ).updateSettings( {
			...editorSettings,
			mediaUpload: canUserUploadMedia ? uploadMedia : undefined,
		} );
	}, [ editorSettings, canUserUploadMedia ] );

	const [ internalPath, setInternalPath ] = useState( '/' );
	const section = path ?? internalPath;
	const onChangeSection = onPathChange ?? setInternalPath;

	const isSelected = ( blockName ) => {
		// Match '/blocks/core%2Fbutton' and
		// '/blocks/core%2Fbutton/typography', but not
		// '/blocks/core%2Fbuttons'.
		return (
			section === `/blocks/${ encodeURIComponent( blockName ) }` ||
			section.startsWith(
				`/blocks/${ encodeURIComponent( blockName ) }/`
			)
		);
	};

	const onSelect = ( blockName, isBlockVariation = false ) => {
		if (
			STYLE_BOOK_COLOR_GROUPS.find(
				( group ) => group.slug === blockName
			)
		) {
			// Go to color palettes Global Styles.
			onChangeSection( '/colors/palette' );
			return;
		}
		if ( blockName === 'typography' ) {
			// Go to typography Global Styles.
			onChangeSection( '/typography' );
			return;
		}

		if ( isBlockVariation ) {
			return;
		}

		// Now go to the selected block.
		onChangeSection( `/blocks/${ encodeURIComponent( blockName ) }` );
	};

	const colors = useMultiOriginPalettes();
	const examples = getExamples( colors );
	const examplesForSinglePageUse = getExamplesForSinglePageUse( examples );

	let previewCategory = null;
	let blockVariation = null;
	if ( section.includes( '/colors' ) ) {
		previewCategory = 'colors';
	} else if ( section.includes( '/typography' ) ) {
		previewCategory = 'text';
	} else if ( section.includes( '/blocks' ) ) {
		previewCategory = 'blocks';
		let blockName = decodeURIComponent( section ).split( '/blocks/' )[ 1 ];

		// The blockName can contain variations, if so, extract the variation.
		if ( blockName?.includes( '/variations' ) ) {
			[ blockName, blockVariation ] = blockName.split( '/variations/' );
		}

		if (
			blockName &&
			examples.find( ( example ) => example.name === blockName )
		) {
			previewCategory = blockName;
		}
	} else if ( ! isStatic ) {
		previewCategory = 'overview';
	}
	const categoryDefinition = STYLE_BOOK_PREVIEW_CATEGORIES.find(
		( category ) => category.slug === previewCategory
	);

	const filteredExamples = useMemo( () => {
		// If there's no category definition there may be a single block.
		if ( ! categoryDefinition ) {
			return {
				examples: [
					examples.find(
						( example ) => example.name === previewCategory
					),
				],
			};
		}

		return getExamplesByCategory( categoryDefinition, examples );
	}, [ categoryDefinition, examples, previewCategory ] );

	const displayedExamples = useMemo( () => {
		// If there's no preview category, show all examples.
		if ( ! previewCategory ) {
			return { examples: examplesForSinglePageUse };
		}

		if ( blockVariation && filteredExamples?.examples?.length ) {
			return {
				examples: applyBlockVariationsToExamples(
					filteredExamples.examples,
					blockVariation
				),
			};
		}

		return filteredExamples;
	}, [
		previewCategory,
		examplesForSinglePageUse,
		blockVariation,
		filteredExamples,
	] );

	const { base: baseConfig } = useGlobalStyles();
	const goTo = getStyleBookNavigationFromPath( section );

	const mergedConfig = useMemo( () => {
		if ( ! isObjectEmpty( userConfig ) && ! isObjectEmpty( baseConfig ) ) {
			return mergeGlobalStyles( baseConfig, userConfig );
		}
		return {};
	}, [ baseConfig, userConfig ] );

	const [ globalStyles ] = useGlobalStylesOutputWithConfig( mergedConfig );

	const settings = useMemo(
		() => ( {
			...editorSettings,
			styles:
				! isObjectEmpty( globalStyles ) && ! isObjectEmpty( userConfig )
					? globalStyles
					: editorSettings.styles,
			isPreviewMode: true,
		} ),
		[ globalStyles, editorSettings, userConfig ]
	);

	return (
		<div className="editor-style-book">
			<BlockEditorProvider settings={ settings }>
				<GlobalStylesRenderer disableRootPadding />
				<StyleBookBody
					examples={ displayedExamples }
					settings={ settings }
					goTo={ goTo }
					isSelected={ ! isStatic ? isSelected : null }
					onSelect={ ! isStatic ? onSelect : null }
				/>
			</BlockEditorProvider>
		</div>
	);
};

export const StyleBookBody = ( {
	examples,
	isSelected,
	onClick,
	onSelect,
	settings,
	title,
	goTo,
	noteActions,
	highlightedAnchor,
} ) => {
	const [ isFocused, setIsFocused ] = useState( false );
	const [ hasIframeLoaded, setHasIframeLoaded ] = useState( false );
	const iframeRef = useRef( null );
	// The presence of an `onClick` prop indicates that the Style Book is being used as a button.
	// In this case, add additional props to the iframe to make it behave like a button.
	const buttonModeProps = {
		role: 'button',
		onFocus: () => setIsFocused( true ),
		onBlur: () => setIsFocused( false ),
		onKeyDown: ( event ) => {
			if ( event.defaultPrevented ) {
				return;
			}
			const { keyCode } = event;
			if ( onClick && ( keyCode === ENTER || keyCode === SPACE ) ) {
				event.preventDefault();
				onClick( event );
			}
		},
		onClick: ( event ) => {
			if ( event.defaultPrevented ) {
				return;
			}
			if ( onClick ) {
				event.preventDefault();
				onClick( event );
			}
		},
		readonly: true,
	};

	const handleLoad = () => setHasIframeLoaded( true );
	useLayoutEffect( () => {
		if ( hasIframeLoaded && iframeRef.current && goTo?.top ) {
			scrollToSection( 'top', iframeRef.current );
		}
	}, [ goTo?.top, hasIframeLoaded ] );

	// Bring the example a selected note points at into view. The anchor is
	// used as an element id rather than a selector: example names contain a
	// slash, which would need escaping in a selector but is fine for a lookup.
	useEffect( () => {
		if ( hasIframeLoaded && iframeRef.current && highlightedAnchor ) {
			scrollToSection(
				`example-${ highlightedAnchor }`,
				iframeRef.current
			);
		}
	}, [ highlightedAnchor, hasIframeLoaded ] );

	return (
		<Iframe
			onLoad={ handleLoad }
			ref={ iframeRef }
			className={ clsx( 'editor-style-book__iframe', {
				'is-focused': isFocused && !! onClick,
				'is-button': !! onClick,
			} ) }
			name="style-book-canvas"
			tabIndex={ 0 }
			{ ...( onClick ? buttonModeProps : {} ) }
		>
			<EditorStyles styles={ settings.styles } />
			<style>
				{ STYLE_BOOK_IFRAME_STYLES }
				{ !! onClick &&
					'body { cursor: var(--wpds-cursor-control); } body * { pointer-events: none; }' }
			</style>
			<Examples
				className="editor-style-book__examples"
				filteredExamples={ examples }
				label={
					title
						? sprintf(
								// translators: %s: Category of blocks, e.g. Text.
								__( 'Examples of blocks in the %s category' ),
								title
						  )
						: __( 'Examples of blocks' )
				}
				isSelected={ isSelected }
				onSelect={ onSelect }
				noteActions={ noteActions }
				highlightedAnchor={ highlightedAnchor }
				key={ title }
			/>
		</Iframe>
	);
};

const Examples = memo(
	( {
		className,
		filteredExamples,
		label,
		isSelected,
		onSelect,
		noteActions,
		highlightedAnchor,
	} ) => {
		return (
			<Composite
				orientation="vertical"
				className={ className }
				aria-label={ label }
				role="grid"
			>
				{ !! filteredExamples?.examples?.length &&
					filteredExamples.examples.map( ( example ) => (
						<Example
							key={ example.name }
							id={ `example-${ example.name }` }
							name={ example.name }
							title={ example.title }
							content={ example.content }
							blocks={ example.blocks }
							isSelected={ isSelected?.( example.name ) }
							noteActions={ noteActions }
							isNoteHighlighted={
								highlightedAnchor === example.name
							}
							onClick={
								!! onSelect
									? () =>
											onSelect(
												example.name,
												!! example.variation
											)
									: null
							}
						/>
					) ) }
				{ !! filteredExamples?.subcategories?.length &&
					filteredExamples.subcategories.map( ( subcategory ) => (
						<Composite.Group
							className="editor-style-book__subcategory"
							key={ `subcategory-${ subcategory.slug }` }
						>
							<Composite.GroupLabel>
								<h2 className="editor-style-book__subcategory-title">
									{ subcategory.title }
								</h2>
							</Composite.GroupLabel>
							<Subcategory
								examples={ subcategory.examples }
								isSelected={ isSelected }
								onSelect={ onSelect }
								noteActions={ noteActions }
								highlightedAnchor={ highlightedAnchor }
							/>
						</Composite.Group>
					) ) }
			</Composite>
		);
	}
);

const Subcategory = ( {
	examples,
	isSelected,
	onSelect,
	noteActions,
	highlightedAnchor,
} ) => {
	return (
		!! examples?.length &&
		examples.map( ( example ) => (
			<Example
				key={ example.name }
				id={ `example-${ example.name }` }
				name={ example.name }
				title={ example.title }
				content={ example.content }
				blocks={ example.blocks }
				isSelected={ isSelected?.( example.name ) }
				noteActions={ noteActions }
				isNoteHighlighted={ highlightedAnchor === example.name }
				onClick={ !! onSelect ? () => onSelect( example.name ) : null }
			/>
		) )
	);
};

const disabledExamples = [ 'example-duotones' ];

/**
 * The per-example notes affordance.
 *
 * It sits in its own grid cell beside the example rather than inside it: the
 * example is itself a `role="button"` composite item, and nesting a button in
 * a button is both invalid and a good way to break the Style Book's arrow-key
 * navigation. Keeping it out of the composite leaves that navigation exactly
 * as it was; the button is reached with Tab.
 *
 * @param {Object}   props
 * @param {string}   props.name        Style Book example name, used as the anchor.
 * @param {string}   props.title       Example title, for the accessible label.
 * @param {number}   props.count       Notes already left on this example.
 * @param {Function} props.onAddNote   Called to start a new note.
 * @param {Function} props.onOpenNotes Called to review existing notes.
 * @return {React.JSX.Element} The button.
 */
const ExampleNoteButton = ( {
	name,
	title,
	count,
	onAddNote,
	onOpenNotes,
} ) => {
	const hasNotes = count > 0;

	return (
		<Button
			className="editor-style-book__example-note-button"
			size="compact"
			icon={ commentIcon }
			variant={ hasNotes ? 'secondary' : 'tertiary' }
			text={ hasNotes ? String( count ) : undefined }
			label={
				hasNotes
					? sprintf(
							/* translators: %1$d: number of notes. %2$s: Title of an example, e.g. Heading. */
							_n(
								'%1$d note on %2$s',
								'%1$d notes on %2$s',
								count
							),
							count,
							title
					  )
					: sprintf(
							/* translators: %s: Title of an example, e.g. Heading. */
							__( 'Add note on %s' ),
							title
					  )
			}
			onClick={ ( event ) => {
				event.stopPropagation();
				if ( hasNotes ) {
					onOpenNotes( name );
				} else {
					onAddNote( name );
				}
			} }
		/>
	);
};

const Example = ( {
	id,
	name,
	title,
	blocks,
	isSelected,
	onClick,
	content,
	noteActions,
	isNoteHighlighted,
} ) => {
	const originalSettings = useSelect(
		( select ) => select( blockEditorStore ).getSettings(),
		[]
	);
	const settings = useMemo(
		() => ( {
			...originalSettings,
			isPreviewMode: true,
		} ),
		[ originalSettings ]
	);

	// Cache the list of blocks to avoid additional processing when the component is re-rendered.
	const renderedBlocks = useMemo(
		() => ( Array.isArray( blocks ) ? blocks : [ blocks ] ),
		[ blocks ]
	);

	const disabledProps =
		disabledExamples.includes( id ) || ! onClick
			? {
					disabled: true,
					accessibleWhenDisabled: !! onClick,
			  }
			: {};

	return (
		<div
			role="row"
			className={ clsx( 'editor-style-book__example-row', {
				'has-note-actions': !! noteActions,
			} ) }
		>
			<div role="gridcell">
				<Composite.Item
					className={ clsx( 'editor-style-book__example', {
						'is-selected': isSelected,
						'is-disabled-example': !! disabledProps?.disabled,
						'is-note-anchor-highlighted': isNoteHighlighted,
					} ) }
					id={ id }
					aria-label={
						!! onClick
							? sprintf(
									// translators: %s: Title of a block, e.g. Heading.
									__( 'Open %s styles in Styles panel' ),
									title
							  )
							: undefined
					}
					render={ <div /> }
					role={ !! onClick ? 'button' : null }
					onClick={ onClick }
					{ ...disabledProps }
				>
					<span className="editor-style-book__example-title">
						{ title }
					</span>
					<div
						className="editor-style-book__example-preview"
						aria-hidden
					>
						<Disabled className="editor-style-book__example-preview__content">
							{ content ? (
								content
							) : (
								<ExperimentalBlockEditorProvider
									value={ renderedBlocks }
									settings={ settings }
								>
									<EditorStyles />
									<BlockList renderAppender={ false } />
								</ExperimentalBlockEditorProvider>
							) }
						</Disabled>
					</div>
				</Composite.Item>
			</div>
			{ !! noteActions && (
				<div role="gridcell">
					<ExampleNoteButton
						name={ name }
						title={ title }
						count={ noteActions.counts?.[ name ] ?? 0 }
						onAddNote={ noteActions.onAddNote }
						onOpenNotes={ noteActions.onOpenNotes }
					/>
				</div>
			) }
		</div>
	);
};

export default forwardRef( StyleBook );
