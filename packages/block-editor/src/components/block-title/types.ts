/**
 * Props of `BlockTitle` and options of `useBlockDisplayTitle`.
 */
export interface BlockTitleProps {
	/**
	 * Client ID of block.
	 */
	clientId: string;
	/**
	 * The maximum length that the block title string may be before truncated.
	 */
	maximumLength?: number;
	/**
	 * The context to pass to `getBlockLabel`.
	 */
	context?: string;
}
