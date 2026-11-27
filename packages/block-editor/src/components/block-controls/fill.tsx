import {
	__experimentalStyleProvider as StyleProvider,
	ToolbarGroup,
} from '@wordpress/components';
import useBlockControlsFill from './hook';
import type { ForwardedContext } from '../inspector-controls/types';
import type { BlockControlsFillProps } from './types';

export default function BlockControlsFill( {
	group = 'default',
	controls,
	children,
	__experimentalShareWithChildBlocks = false,
}: BlockControlsFillProps ) {
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
			{ /* eslint-disable-next-line react-hooks/static-components */ }
			<Fill>
				{ ( fillProps ) => {
					// `fillProps.forwardedContext` is an array of context provider entries, provided by slot,
					// that should wrap the fill markup.
					const {
						forwardedContext = [],
					}: { forwardedContext?: ForwardedContext } = fillProps;
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
