export type RequestIdleCallbackCallback = (
	/**
	 * @param timeOrDeadline - IdleDeadline object or a timestamp number.
	 */
	timeOrDeadline: IdleDeadline | number
) => void;
