/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	Disabled,
	Composite,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
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
import { STYLE_BOOK_IFRAME_STYLES } from './constants';
import {
	getExamplesByCategory,
	getTopLevelStyleBookCategories,
} from './categories';
import { getExamples } from './examples';

const {
	ExperimentalBlockEditorProvider,
	useGlobalStyle,
	GlobalStylesContext,
	useGlobalStylesOutputWithConfig,
} = unlock( blockEditorPrivateApis );
const { mergeBaseAndUserConfigs } = unlock( editorPrivateApis );

const { Tabs } = unlock( componentsPrivateApis );

function isObjectEmpty( object ) {
	return ! object || Object.keys( object ).length === 0;
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
			getTopLevelStyleBookCategories().filter( ( category ) =>
				examples.some(
					( example ) => example.category === category.slug
				)
			),
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
					<Tabs>
						<div className="edit-site-style-book__tablist-container">
							<Tabs.TabList>
								{ tabs.map( ( tab ) => (
									<Tabs.Tab
										tabId={ tab.slug }
										key={ tab.slug }
									>
										{ tab.title }
									</Tabs.Tab>
								) ) }
							</Tabs.TabList>
						</div>
						{ tabs.map( ( tab ) => (
							<Tabs.TabPanel
								key={ tab.slug }
								tabId={ tab.slug }
								focusable={ false }
								className="edit-site-style-book__tabpanel"
							>
								<StyleBookBody
									category={ tab.slug }
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
				{ STYLE_BOOK_IFRAME_STYLES }
				{ !! onClick &&
					'body { cursor: pointer; } body * { pointer-events: none; }' }
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
		const categoryDefinition = category
			? getTopLevelStyleBookCategories().find(
					( _category ) => _category.slug === category
			  )
			: null;

		const filteredExamples = categoryDefinition
			? getExamplesByCategory( categoryDefinition, examples )
			: { examples };

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
							title={ example.title }
							blocks={ example.blocks }
							isSelected={ isSelected( example.name ) }
							onClick={ () => {
								onSelect?.( example.name );
							} }
						/>
					) ) }
				{ !! filteredExamples?.subcategories?.length &&
					filteredExamples.subcategories.map( ( subcategory ) => (
						<Composite.Group
							className="edit-site-style-book__subcategory"
							key={ `subcategory-${ subcategory.slug }` }
						>
							<Composite.GroupLabel>
								<h2 className="edit-site-style-book__subcategory-title">
									{ subcategory.title }
								</h2>
							</Composite.GroupLabel>
							<Subcategory
								examples={ subcategory.examples }
								isSelected={ isSelected }
								onSelect={ onSelect }
							/>
						</Composite.Group>
					) ) }
			</Composite>
		);
	}
);

const Subcategory = ( { examples, isSelected, onSelect } ) => {
	return (
		!! examples?.length &&
		examples.map( ( example ) => (
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
		) )
	);
};

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
				<Composite.Item
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
				</Composite.Item>
			</div>
		</div>
	);
};

export default StyleBook;
