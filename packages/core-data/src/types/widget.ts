export interface Widget {
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
	rendered_form?: string;
	/**
	 * Instance settings of the widget, if supported.
	 */
	instance?: {
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
		raw?: {
			[ k: string ]: unknown;
		};
		[ k: string ]: unknown;
	};
	/**
	 * URL-encoded form data from the widget admin form. Used to update a widget that does not support instance. Write only.
	 */
	form_data?: string;
}
