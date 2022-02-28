/**
 * Internal dependencies
 */

import useBlockDisplayTitle, {
	MAXIMUM_TITLE_LENGTH,
} from './use-block-display-title';

/**
 * Renders the block's configured title as a string, or empty if the title
 * cannot be determined.
 *
 * @example
 *
 * ```jsx
 * <BlockTitle clientId="afd1cb17-2c08-4e7a-91be-007ba7ddc3a1" />
 * ```
 *
 * @param {Object} props
 * @param {string} props.clientId Client ID of block.
 * @param {number} props.maximumLength The maximum length that the block title string may be before truncated.
 *
 * @return {JSX.Element} Block title.
 */
export default function BlockTitle( {
	clientId,
	maximumLength = MAXIMUM_TITLE_LENGTH,
} ) {
	return useBlockDisplayTitle( clientId, maximumLength );
}
