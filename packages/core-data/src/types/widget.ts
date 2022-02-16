/**
 * Internal dependencies
 */
import { Context, ContextualField, WithoutNevers } from './common';

interface FullWidget< C extends Context > {
	/**
	 * Unique identifier for the widget.
	 */
	id: string;
	/**
	 * The type of the widget. Corresponds to ID in widget-types endpoint.
	 */
	id_base: string;
	/**
	 * The sidebar the widget belongs to.
	 */
	sidebar: string;
	/**
	 * HTML representation of the widget.
	 */
	rendered: string;
	/**
	 * HTML representation of the widget admin form.
	 */
	rendered_form: ContextualField< string, 'edit', C >;
	/**
	 * Instance settings of the widget, if supported.
	 */
	instance?: WidgetInstance;
	/**
	 * URL-encoded form data from the widget admin form. Used to update a widget that does not support instance. Write only.
	 */
	form_data?: string;
}

interface WidgetInstance {
	/**
	 * Base64 encoded representation of the instance settings.
	 */
	encoded?: string;
	/**
	 * Cryptographic hash of the instance settings.
	 */
	hash?: string;
	/**
	 * Unencoded instance settings, if supported.
	 */
	raw?: Record< string, string >;
}

export type Widget< C extends Context > = WithoutNevers< FullWidget< C > >;
export interface EditedWidget extends Widget< 'edit' > {}
