/**
 * Internal dependencies
 */
import { Context, ContextualField, OmitNevers } from './helpers';

import { BaseTypes as _BaseTypes } from './base-types';

declare module './base-types' {
	export namespace BaseTypes {
		export interface Widget< C extends Context > {
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
			instance: ContextualField< WidgetInstance, 'edit', C >;
			/**
			 * URL-encoded form data from the widget admin form. Used
			 * to update a widget that does not support instance.
			 *
			 * This is never sent from the server to the client but exists
			 * because we might send an update.
			 */
			form_data?: string;
		}

		interface WidgetInstance {
			/**
			 * Base64 encoded representation of the instance settings.
			 */
			encoded: string;
			/**
			 * Cryptographic hash of the instance settings.
			 */
			hash: string;
			/**
			 * Unencoded instance settings, if supported.
			 */
			raw: Record< string, string >;
		}
	}
}

export type Widget< C extends Context > = OmitNevers<
	_BaseTypes.Widget< C >
>;
