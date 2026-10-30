/**
 * Props of `BlockTitle` and options of `useBlockDisplayTitle`.
 */
export interface BlockTitleProps {
	/**
	 * Client ID of block. Without one, the title is `null`.
	 */
	clientId?: string | null;
	/**
	 * The maximum length that the block title string may be before truncated.
	 */
	maximumLength?: number;
	/**
	 * The context to pass to `getBlockLabel`.
	 */
	context?: string;
}
