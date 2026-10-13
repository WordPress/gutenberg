/**
 * Object describing a user action option associated with a notice.
 */
export type NoticeAction = {
	/**
	 * Message to use as action label.
	 */
	label: string;

	/**
	 * Optional URL of resource if action incurs browser navigation.
	 */
	url?: string;

	/**
	 * Optional function to invoke when action is triggered by user.
	 */
	onClick?: VoidFunction;
};

/**
 * Notice object.
 */
export type Notice = {
	/**
	 * Unique identifier of notice.
	 */
	id: string;

	/**
	 * Status of notice, one of `success`, `info`, `error`, or `warning`. Defaults to `info`.
	 */
	status: 'success' | 'info' | 'error' | 'warning';

	/**
	 * Notice message.
	 */
	content: string;

	/**
	 * Audibly announced message text used by assistive technologies.
	 */
	spokenMessage: string | null;

	/**
	 * Notice message as raw HTML. Intended to serve primarily for compatibility of server-rendered notices,
	 * and SHOULD NOT be used for notices. It is subject to removal without notice.
	 */
	__unstableHTML?: boolean;

	/**
	 * Whether the notice can be dismissed by user. Defaults to `true`.
	 */
	isDismissible: boolean;

	/**
	 * Whether the notice includes an explicit dismiss button and can't be dismissed by clicking the body of the notice. Only applies when type is `snackbar`.
	 */
	explicitDismiss?: boolean;

	/**
	 * Called when the notice is dismissed.
	 */
	onDismiss?: VoidFunction;

	/**
	 * Type of notice, one of `default`, or `snackbar`.
	 *
	 * @default 'default'
	 */
	type: 'default' | 'snackbar' | ( string & {} );

	/**
	 * User actions to present with notice.
	 */
	actions: NoticeAction[];

	/**
	 * An icon displayed with the notice. Only used when type is `snackbar`.
	 */
	icon?: string | null;
};

export type NoticeOptions = {
	/**
	 * Context under which to group notice.
	 * @default 'global'
	 */
	context?: string;

	/**
	 * Identifier for notice. Automatically assigned if not specified.
	 */
	id?: string;

	/**
	 * Whether the notice can be dismissed by user.
	 * @default true
	 */
	isDismissible?: boolean;

	/**
	 * Type of notice, one of `default`, or `snackbar`.
	 * @default 'default'
	 */
	type?: 'default' | 'snackbar' | ( string & {} );

	/**
	 * Whether the notice content should be announced to screen readers.
	 * @default true
	 */
	speak?: boolean;

	/**
	 * User actions to be presented with notice.
	 */
	actions?: NoticeAction[];

	/**
	 * An icon displayed with the notice. Only used when type is set to `snackbar`.
	 */
	icon?: string | null;

	/**
	 * Whether the notice includes an explicit dismiss button and can't be dismissed by clicking the body of the notice. Only applies when type is set to `snackbar`.
	 */
	explicitDismiss?: boolean;

	/**
	 * Called when the notice is dismissed.
	 */
	onDismiss?: VoidFunction;

	/**
	 * Notice message as raw HTML. Intended to serve primarily for compatibility of server-rendered notices,
	 * and SHOULD NOT be used for notices. It is subject to removal without notice.
	 */
	__unstableHTML?: boolean;
};

export type ReducerAction =
	| {
			type: 'CREATE_NOTICE';
			context: string;
			notice: Notice;
	  }
	| {
			type: 'REMOVE_NOTICE';
			context: string;
			id: string;
	  }
	| {
			type: 'REMOVE_NOTICES';
			context: string;
			ids: Array< string >;
	  }
	| {
			type: 'REMOVE_ALL_NOTICES';
			context: string;
			noticeType: string;
	  }
	| {
			/**
			 * Represents any action not explicitly handled by this reducer,
			 * allowing TypeScript's discriminated union narrowing to work correctly.
			 */
			type: '@@UNKNOWN_ACTION';
			context?: string;
	  };
