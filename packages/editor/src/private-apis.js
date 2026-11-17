import * as interfaceApis from '@wordpress/interface';
import { lock } from './lock-unlock';
import BackButton from './components/header/back-button';
import Editor from './components/editor';
import PluginPostExcerpt from './components/post-excerpt/plugin';
import PostCardPanel from './components/post-card-panel';
import PreferencesModal from './components/preferences-modal';
import { usePostActions } from './components/post-actions/actions';
import usePostFields from './components/post-fields';
import MoreMenuItem from './components/more-menu/more-menu-item';
import MoreMenuPreferenceItem from './components/more-menu/more-menu-preference-item';
import ToolsMoreMenuGroup from './components/more-menu/tools-more-menu-group';
import SiteExport from './components/site-export';
import ViewMoreMenuGroup from './components/more-menu/view-more-menu-group';
import ResizableEditor from './components/resizable-editor';
import { registerCoreBlockBindingsSources } from './bindings/api';
import GlobalStylesUIWrapper from './components/global-styles';
import { StyleBookPreview } from './components/style-book';
import { useGlobalStyles, useStyle } from './components/global-styles/hooks';
import { GlobalStylesActionMenu } from './components/global-styles/menu';
import UploadProgressSnackbar from './components/upload-progress-snackbar';
import { diffRevisionContent } from './components/post-revisions-preview/block-diff';
import {
	registerDiffFormatTypes,
	unregisterDiffFormatTypes,
} from './components/post-revisions-preview/diff-format-types';
import {
	DiffDescriptions,
	REVISION_DIFF_STYLES,
	REVISION_REMOVED_FILTER_SVG,
} from './components/post-revisions-preview/block-diff-view';
import { RevisionsCodeDiff } from './components/post-revisions-preview/revisions-code-diff';

const { store: interfaceStore, ...remainingInterfaceApis } = interfaceApis;

export const privateApis = {};
lock( privateApis, {
	BackButton,
	Editor,
	PluginPostExcerpt,
	PostCardPanel,
	PreferencesModal,
	usePostActions,
	usePostFields,
	MoreMenuItem,
	MoreMenuPreferenceItem,
	ToolsMoreMenuGroup,
	SiteExport,
	ViewMoreMenuGroup,
	ResizableEditor,
	UploadProgressSnackbar,
	registerCoreBlockBindingsSources,
	// Global Styles
	GlobalStylesUIWrapper,
	GlobalStylesActionMenu,
	StyleBookPreview,
	useGlobalStyles,
	useStyle,
	// The revisions diff: the block differ, its rich-text formats, the
	// visual layer (styles, removed-block filter, descriptions; the
	// BlockListBlock filter registers when block-diff-view loads), and the
	// presentational code diff. Hosts outside the revisions screen (a
	// collaboration plugin's conflict review) render diffed blocks with these.
	diffRevisionContent,
	registerDiffFormatTypes,
	unregisterDiffFormatTypes,
	DiffDescriptions,
	REVISION_DIFF_STYLES,
	REVISION_REMOVED_FILTER_SVG,
	RevisionsCodeDiff,
	// This is a temporary private API while we're updating the site editor to use EditorProvider.
	interfaceStore,
	...remainingInterfaceApis,
} );
