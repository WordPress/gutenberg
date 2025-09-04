/**
 * WordPress dependencies
 */
import {
	__experimentalStyleProvider as StyleProvider,
	ToolbarGroup,
} from '@wordpress/components';
import { Children } from '@wordpress/element';

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

	return (
		<StyleProvider document={ document }>
			<Fill>
				{ ( fillProps ) => {
					// `fillProps.forwardedContext` is an array of context provider entries, provided by slot,
					// that should wrap the fill markup.
					const { forwardedContext = [], shouldRender = () => true } =
						fillProps;

					// Filter children based on shouldRender callback
					const childrenArray = Children.toArray( children );
					const filteredChildren =
						childrenArray.filter( shouldRender );

					const filteredMarkup = (
						<>
							{ group === 'default' && (
								<ToolbarGroup controls={ controls } />
							) }
							{ filteredChildren }
						</>
					);

					return forwardedContext.reduce(
						( inner, [ Provider, props ] ) => (
							<Provider { ...props }>{ inner }</Provider>
						),
						filteredMarkup
					);
				} }
			</Fill>
		</StyleProvider>
	);
}
