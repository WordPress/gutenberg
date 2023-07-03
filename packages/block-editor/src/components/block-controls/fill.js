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
	if ( ! Fill ) {
		return null;
	}

	const innerMarkup = (
		<>
			{ group === 'default' && <ToolbarGroup controls={ controls } /> }
			{ children }
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
