import useBlockDisplayTitle from './use-block-display-title';
import type { BlockTitleProps } from './types';

/**
 * Renders the block's configured title as a string, or empty if the title
 * cannot be determined.
 *
 * @example
 *
 * ```jsx
 * <BlockTitle clientId="afd1cb17-2c08-4e7a-91be-007ba7ddc3a1" maximumLength={ 17 }/>
 * ```
 *
 * @param {Object}           props
 * @param {string}           props.clientId      Client ID of block.
 * @param {number|undefined} props.maximumLength The maximum length that the block title string may be before truncated.
 * @param {string|undefined} props.context       The context to pass to `getBlockLabel`.
 *
 * @return {React.JSX.Element} Block title.
 */
export default function BlockTitle( {
	clientId,
	maximumLength,
	context,
}: BlockTitleProps ) {
	return useBlockDisplayTitle( { clientId, maximumLength, context } );
}
