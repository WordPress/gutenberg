/**
 * External dependencies
 */
import classnames from 'classnames';
import { isEmpty } from 'lodash';
/**
 * WordPress dependencies
 */
import { Button, Disabled } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	BlockList,
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
	__unstableEditorStyles as EditorStyles,
	__unstableIframe as Iframe,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { closeSmall } from '@wordpress/icons';
import {
	useResizeObserver,
	useFocusOnMount,
	useFocusReturn,
	useMergeRefs,
} from '@wordpress/compose';
import { useMemo } from '@wordpress/element';
import { ESCAPE } from '@wordpress/keycodes';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */

import { unlock } from '../../private-apis';
import { StyleBookFill } from '../style-book';
import { mergeBaseAndUserConfigs } from '../global-styles/global-styles-provider';

const {
	ExperimentalBlockEditorProvider,
	useGlobalStyle,
	useGlobalStylesOutput,
} = unlock( blockEditorPrivateApis );

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
function Revisions( {
	isSelected,
	onSelect,
	onClose,
	revision: globalStylesRevision,
} ) {
	const [ resizeObserver, sizes ] = useResizeObserver();
	const focusOnMountRef = useFocusOnMount( 'firstElement' );
	const sectionFocusReturnRef = useFocusReturn();

	const [ textColor ] = useGlobalStyle( 'color.text' );
	const [ backgroundColor ] = useGlobalStyle( 'color.background' );

	const { baseConfig } = useSelect(
		( select ) => ( {
			baseConfig:
				select(
					coreStore
				).__experimentalGetCurrentThemeBaseGlobalStyles(),
		} ),
		[]
	);

	const mergedConfig = useMemo( () => {
		if ( ! isEmpty( globalStylesRevision ) && ! isEmpty( baseConfig ) ) {
			return mergeBaseAndUserConfigs( baseConfig, globalStylesRevision );
		}
		return null;
	}, [ baseConfig, globalStylesRevision ] );

	const renderedBlocks = useSelect(
		( select ) => select( blockEditorStore ).getBlocks(),
		[]
	);

	const renderedBlocksArray = useMemo(
		() =>
			Array.isArray( renderedBlocks )
				? renderedBlocks
				: [ renderedBlocks ],
		[ renderedBlocks ]
	);

	const originalSettings = useSelect(
		( select ) => select( blockEditorStore ).getSettings(),
		[]
	);

	const settings = useMemo(
		() => ( { ...originalSettings, __unstableIsPreviewMode: true } ),
		[ originalSettings ]
	);

	function closeOnEscape( event ) {
		if ( event.keyCode === ESCAPE && ! event.defaultPrevented ) {
			event.preventDefault();
			onClose();
		}
	}

	const [ globalStyles ] = useGlobalStylesOutput( mergedConfig );
	const editorStyles =
		! isEmpty( globalStyles ) && ! isEmpty( globalStylesRevision )
			? globalStyles
			: settings.styles;

	return (
		<StyleBookFill>
			{ /* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */ }
			<section
				className={ classnames( 'edit-site-revisions', {
					'is-wide': sizes.width > 600,
				} ) }
				style={ {
					color: textColor,
					background: backgroundColor,
					height: '100%',
				} }
				aria-label={ __( 'Revisions' ) }
				onKeyDown={ closeOnEscape }
				ref={ useMergeRefs( [
					sectionFocusReturnRef,
					focusOnMountRef,
				] ) }
			>
				{ resizeObserver }
				<Button
					className="edit-site-style-book__close-button"
					icon={ closeSmall }
					label={ __( 'Close Style Book' ) }
					onClick={ onClose }
					showTooltip={ false }
				/>
				<Iframe
					className="edit-site-style-book__iframe"
					name="style-revisions"
					tabIndex={ 0 }
				>
					<EditorStyles styles={ editorStyles } />
					<style>
						{
							// Forming a "block formatting context" to prevent margin collapsing.
							// @see https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Block_formatting_context
							`.is-root-container { display: flow-root; }
											body { position: relative; padding: 32px !important; }` +
								STYLE_BOOK_IFRAME_STYLES
						}
					</style>
					<Disabled className="edit-site-style-book__example-preview__content">
						<ExperimentalBlockEditorProvider
							value={ renderedBlocksArray }
							settings={ settings }
						>
							<BlockList renderAppender={ false } />
						</ExperimentalBlockEditorProvider>
					</Disabled>
				</Iframe>
			</section>
		</StyleBookFill>
	);
}

export default Revisions;
