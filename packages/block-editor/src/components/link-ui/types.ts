import type { ComponentProps, ReactNode } from 'react';
import type { IconType, Popover } from '@wordpress/components';
import type {
	LinkControlValue,
	LinkSuggestionsQuery,
	TransformSuggestions,
} from '../link-control/types';

/**
 * What a pane rendered by a tool receives.
 */
export interface LinkUIPaneRenderProps {
	/**
	 * Returns to the search pane. Focus goes back to the tool's button and
	 * the search keeps the text it had.
	 */
	onBack: () => void;
}

/**
 * A button shown under the search while no link is set. Pressing it replaces
 * the search with the pane the tool renders.
 */
export interface LinkUITool {
	id: string;
	label: string;
	icon?: IconType;
	render: ( props: LinkUIPaneRenderProps ) => ReactNode;
}

export interface LinkUINewPage {
	title: string;
	/**
	 * Whether to publish the page right away rather than save it as a draft.
	 */
	publish: boolean;
}

/**
 * Creates a page and resolves with the link to it. A rejection with a
 * `message` is shown in the form.
 */
export type LinkUICreatePage = (
	page: LinkUINewPage
) => Promise< LinkControlValue >;

export interface LinkUIProps {
	/**
	 * The current link. `entityTitle`, `image` and `badges` feed the preview.
	 */
	link: LinkControlValue;
	/**
	 * How suggestions are searched and ranked. Defaults to preferring the
	 * link's own type, with pages before anything is typed.
	 */
	suggestionsQuery?: LinkSuggestionsQuery;
	transformSuggestions?: TransformSuggestions;
	/**
	 * Whether the preview treats the link as an entity with a bound URL.
	 */
	handleEntities?: boolean;
	/**
	 * Dialog title read by assistive technology.
	 */
	title?: string;
	/**
	 * Dialog description read by assistive technology.
	 */
	description?: string;
	anchor?: ComponentProps< typeof Popover >[ 'anchor' ];
	onChange: ( value: LinkControlValue ) => void;
	onRemove?: () => void;
	onCancel?: () => void;
	onClose?: () => void;
	/**
	 * When set, a "Create page" tool opens a form that creates a page with
	 * this and links to it.
	 */
	onCreatePage?: LinkUICreatePage;
	/**
	 * Tools shown after "Create page".
	 */
	tools?: LinkUITool[];
}
