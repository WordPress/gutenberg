import {
	__experimentalStyleProvider as StyleProvider,
	ToolbarGroup,
} from '@wordpress/components';
import useBlockControlsFill from './hook';
import type { ForwardedContext } from '../inspector-controls/types';
import type { BlockControlsFillProps } from './types';
import renderActionIcon from '../../utils/render-action-icon';

type Controls = NonNullable< BlockControlsFillProps[ 'controls' ] >;
type Control = Exclude< Controls[ number ], unknown[] >;

function isControlSets( controls: Controls ): controls is Control[][] {
	return Array.isArray( controls[ 0 ] );
}

const withActionIcon = ( control: Control ) => ( {
	...control,
	icon: renderActionIcon( control.icon ),
} );

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

	let markedControls = controls;
	if ( controls ) {
		markedControls = isControlSets( controls )
			? controls.map( ( set ) => set.map( withActionIcon ) )
			: controls.map( withActionIcon );
	}

	const innerMarkup = (
		<>
			{ group === 'default' && (
				<ToolbarGroup controls={ markedControls } />
			) }
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
