/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	Disabled,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import {
	getCategories,
	getBlockType,
	getBlockTypes,
	getBlockFromExample,
	createBlock,
} from '@wordpress/blocks';
import {
	BlockList,
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
	__unstableEditorStyles as EditorStyles,
	__unstableIframe as Iframe,
} from '@wordpress/block-editor';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { useSelect } from '@wordpress/data';
import { useResizeObserver } from '@wordpress/compose';
import { useMemo, useState, memo, useContext } from '@wordpress/element';
import { ENTER, SPACE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import EditorCanvasContainer from '../editor-canvas-container';

const {
	ExperimentalBlockEditorProvider,
	useGlobalStyle,
	GlobalStylesContext,
	useGlobalStylesOutputWithConfig,
} = unlock( blockEditorPrivateApis );
const { mergeBaseAndUserConfigs } = unlock( editorPrivateApis );

const {
	CompositeV2: Composite,
	CompositeItemV2: CompositeItem,
	useCompositeStoreV2: useCompositeStore,
	Tabs,
} = unlock( componentsPrivateApis );

// The content area of the Style Book is rendered within an iframe so that global styles
// are applied to elements within the entire content area. To support elements that are
// not part of the block previews, such as headings and layout for the block previews,
// additional CSS rules need to be passed into the iframe. These are hard-coded below.
// Note that button styles are unset, and then focus rules from the `Button` component are
// applied to the `button` element, targeted via `.edit-site-style-book__example`.
// This is to ensure that browser default styles for buttons are not applied to the previews.
const STYLE_BOOK_IFRAME_STYLES = `
	.edit-site-style-book__examples {
		max-width: 900px;
		margin: 0 auto;
	}

	.edit-site-style-book__example {
		border-radius: 2px;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		gap: 40px;
		margin-bottom: 40px;
		padding: 16px;
		width: 100%;
		box-sizing: border-box;
		scroll-margin-top: 32px;
		scroll-margin-bottom: 32px;
	}

	.edit-site-style-book__example.is-selected {
		box-shadow: 0 0 0 1px var(--wp-components-color-accent, var(--wp-admin-theme-color, #007cba));
	}

	.edit-site-style-book__example:focus:not(:disabled) {
		box-shadow: 0 0 0 var(--wp-admin-border-width-focus) var(--wp-components-color-accent, var(--wp-admin-theme-color, #007cba));
		outline: 3px solid transparent;
	}

	.edit-site-style-book__examples.is-wide .edit-site-style-book__example {
		flex-direction: row;
	}

	.edit-site-style-book__example-title {
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
		font-size: 11px;
		font-weight: 500;
		line-height: normal;
		margin: 0;
		text-align: left;
		text-transform: uppercase;
	}

	.edit-site-style-book__examples.is-wide .edit-site-style-book__example-title {
		text-align: right;
		width: 120px;
	}

	.edit-site-style-book__example-preview {
		width: 100%;
	}

	.edit-site-style-book__example-preview .block-editor-block-list__insertion-point,
	.edit-site-style-book__example-preview .block-list-appender {
		display: none;
	}

	.edit-site-style-book__example-preview .is-root-container > .wp-block:first-child {
		margin-top: 0;
	}
	.edit-site-style-book__example-preview .is-root-container > .wp-block:last-child {
		margin-bottom: 0;
	}
`;

function isObjectEmpty( object ) {
	return ! object || Object.keys( object ).length === 0;
}

function getExamples() {
	const nonHeadingBlockExamples = getBlockTypes()
		.filter( ( blockType ) => {
			const { name, example, supports } = blockType;
			return (
				name !== 'core/heading' &&
				!! example &&
				supports.inserter !== false
			);
		} )
		.map( ( blockType ) => ( {
			name: blockType.name,
			title: blockType.title,
			category: blockType.category,
			blocks: getBlockFromExample( blockType.name, blockType.example ),
		} ) );

	const isHeadingBlockRegistered = !! getBlockType( 'core/heading' );

	if ( ! isHeadingBlockRegistered ) {
		return nonHeadingBlockExamples;
	}

	// Use our own example for the Heading block so that we can show multiple
	// heading levels.
	const headingsExample = {
		name: 'core/heading',
		title: __( 'Headings' ),
		category: 'text',
		blocks: [ 1, 2, 3, 4, 5, 6 ].map( ( level ) => {
			return createBlock( 'core/heading', {
				content: sprintf(
					// translators: %d: heading level e.g: "1", "2", "3"
					__( 'Heading %d' ),
					level
				),
				level,
			} );
		} ),
	};

	return [ headingsExample, ...nonHeadingBlockExamples ];
}

function StyleBook( {
	enableResizing = true,
	isSelected,
	onClick,
	onSelect,
	showCloseButton = true,
	onClose,
	showTabs = true,
	userConfig = {},
} ) {
	const [ resizeObserver, sizes ] = useResizeObserver();
	const [ textColor ] = useGlobalStyle( 'color.text' );
	const [ backgroundColor ] = useGlobalStyle( 'color.background' );
	const [ examples ] = useState( getExamples );
	const tabs = useMemo(
		() =>
			getCategories()
				.filter( ( category ) =>
					examples.some(
						( example ) => example.category === category.slug
					)
				)
				.map( ( category ) => ( {
					name: category.slug,
					title: category.title,
					icon: category.icon,
				} ) ),
		[ examples ]
	);
	const { base: baseConfig } = useContext( GlobalStylesContext );

	const mergedConfig = useMemo( () => {
		if ( ! isObjectEmpty( userConfig ) && ! isObjectEmpty( baseConfig ) ) {
			return mergeBaseAndUserConfigs( baseConfig, userConfig );
		}
		return {};
	}, [ baseConfig, userConfig ] );

	// Copied from packages/edit-site/src/components/revisions/index.js
	// could we create a shared hook?
	const originalSettings = useSelect(
		( select ) => select( blockEditorStore ).getSettings(),
		[]
	);

	const settings = useMemo(
		() => ( { ...originalSettings, __unstableIsPreviewMode: true } ),
		[ originalSettings ]
	);

	const [ globalStyles ] = useGlobalStylesOutputWithConfig( mergedConfig );

	settings.styles =
		! isObjectEmpty( globalStyles ) && ! isObjectEmpty( userConfig )
			? globalStyles
			: settings.styles;

	return (
		<EditorCanvasContainer
			onClose={ onClose }
			enableResizing={ enableResizing }
			closeButtonLabel={ showCloseButton ? __( 'Close' ) : null }
		>
			<div
				className={ clsx( 'edit-site-style-book', {
					'is-wide': sizes.width > 600,
					'is-button': !! onClick,
				} ) }
				style={ {
					color: textColor,
					background: backgroundColor,
				} }
			>
				{ resizeObserver }
				{ showTabs ? (
					<div className="edit-site-style-book__tabs">
						<Tabs>
							<Tabs.TabList>
								{ tabs.map( ( tab ) => (
									<Tabs.Tab
										tabId={ tab.name }
										key={ tab.name }
									>
										{ tab.title }
									</Tabs.Tab>
								) ) }
							</Tabs.TabList>
							{ tabs.map( ( tab ) => (
								<Tabs.TabPanel
									key={ tab.name }
									tabId={ tab.name }
									focusable={ false }
								>
									<StyleBookBody
										category={ tab.name }
										examples={ examples }
										isSelected={ isSelected }
										onSelect={ onSelect }
										settings={ settings }
										sizes={ sizes }
										title={ tab.title }
									/>
								</Tabs.TabPanel>
							) ) }
						</Tabs>
					</div>
				) : (
					<StyleBookBody
						examples={ examples }
						isSelected={ isSelected }
						onClick={ onClick }
						onSelect={ onSelect }
						settings={ settings }
						sizes={ sizes }
					/>
				) }
			</div>
		</EditorCanvasContainer>
	);
}

const StyleBookBody = ( {
	category,
	examples,
	isSelected,
	onClick,
	onSelect,
	settings,
	sizes,
	title,
} ) => {
	const [ isFocused, setIsFocused ] = useState( false );

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

	const buttonModeStyles = onClick
		? 'body { cursor: pointer; } body * { pointer-events: none; }'
		: '';

	return (
		<Iframe
			className={ clsx( 'edit-site-style-book__iframe', {
				'is-focused': isFocused && !! onClick,
				'is-button': !! onClick,
			} ) }
			name="style-book-canvas"
			tabIndex={ 0 }
			{ ...( onClick ? buttonModeProps : {} ) }
		>
			<EditorStyles styles={ settings.styles } />
			<style>
				{
					// Forming a "block formatting context" to prevent margin collapsing.
					// @see https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Block_formatting_context
					`.is-root-container { display: flow-root; }
						body { position: relative; padding: 32px !important; }` +
						STYLE_BOOK_IFRAME_STYLES +
						buttonModeStyles
				}
			</style>
			<Examples
				className={ clsx( 'edit-site-style-book__examples', {
					'is-wide': sizes.width > 600,
				} ) }
				examples={ examples }
				category={ category }
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
				key={ category }
			/>
		</Iframe>
	);
};

const Examples = memo(
	( { className, examples, category, label, isSelected, onSelect } ) => {
		const compositeStore = useCompositeStore( { orientation: 'vertical' } );

		return (
			<Composite
				store={ compositeStore }
				className={ className }
				aria-label={ label }
				role="grid"
			>
				{ examples
					.filter( ( example ) =>
						category ? example.category === category : true
					)
					.map( ( example ) => (
						<Example
							key={ example.name }
							id={ `example-${ example.name }` }
							title={ example.title }
							blocks={ example.blocks }
							isSelected={ isSelected( example.name ) }
							onClick={ () => {
								onSelect?.( example.name );
							} }
						/>
					) ) }
			</Composite>
		);
	}
);

const Example = ( { id, title, blocks, isSelected, onClick } ) => {
	const originalSettings = useSelect(
		( select ) => select( blockEditorStore ).getSettings(),
		[]
	);
	const settings = useMemo(
		() => ( {
			...originalSettings,
			focusMode: false, // Disable "Spotlight mode".
			__unstableIsPreviewMode: true,
		} ),
		[ originalSettings ]
	);

	// Cache the list of blocks to avoid additional processing when the component is re-rendered.
	const renderedBlocks = useMemo(
		() => ( Array.isArray( blocks ) ? blocks : [ blocks ] ),
		[ blocks ]
	);

	return (
		<div role="row">
			<div role="gridcell">
				<CompositeItem
					className={ clsx( 'edit-site-style-book__example', {
						'is-selected': isSelected,
					} ) }
					id={ id }
					aria-label={ sprintf(
						// translators: %s: Title of a block, e.g. Heading.
						__( 'Open %s styles in Styles panel' ),
						title
					) }
					render={ <div /> }
					role="button"
					onClick={ onClick }
				>
					<span className="edit-site-style-book__example-title">
						{ title }
					</span>
					<div
						className="edit-site-style-book__example-preview"
						aria-hidden
					>
						<Disabled className="edit-site-style-book__example-preview__content">
							<ExperimentalBlockEditorProvider
								value={ renderedBlocks }
								settings={ settings }
							>
								<BlockList renderAppender={ false } />
							</ExperimentalBlockEditorProvider>
						</Disabled>
					</div>
				</CompositeItem>
			</div>
		</div>
	);
};

export default StyleBook;
