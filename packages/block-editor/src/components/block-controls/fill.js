/**
 * WordPress dependencies
 */
import {
	__experimentalStyleProvider as StyleProvider,
	ToolbarGroup,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import useBlockControlsFill from './hook';
import { useBlockEditingMode } from '../block-editing-mode';

export default function BlockControlsFill( {
	group = 'default',
	controls,
	children,
	__experimentalShareWithChildBlocks = false,
} ) {
	const Fill = useBlockControlsFill(
		group,
		__experimentalShareWithChildBlocks
	);
	const blockEditingMode = useBlockEditingMode();

	if ( ! Fill ) {
		return null;
	}

	// Filter children in content-only mode
	let filteredChildren = children;
	if ( blockEditingMode === 'contentOnly' && Array.isArray( children ) ) {
		filteredChildren = children.filter( ( child ) => {
			return child?.props?.category === 'content';
		} );
	}

	const innerMarkup = (
		<>
			{ group === 'default' && <ToolbarGroup controls={ controls } /> }
			{ filteredChildren }
		</>
	);

	return (
		<StyleProvider document={ document }>
			<Fill>
				{ ( fillProps ) => {
					// `fillProps.forwardedContext` is an array of context provider entries, provided by slot,
					// that should wrap the fill markup.
					const { forwardedContext = [] } = fillProps;
					return forwardedContext.reduce(
						( inner, [ Provider, props ] ) => (
							<Provider { ...props }>{ inner }</Provider>
						),
						innerMarkup
					);
				} }
			</Fill>
		</StyleProvider>
	);
}
