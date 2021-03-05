/**
 * Internal dependencies
 */
import Edit from './edit';
import { BlockEditContextProvider, useBlockEditContext } from './context';

export { useBlockEditContext };

export default function BlockEdit( props ) {
	return (
		<BlockEditContextProvider value={ props.clientId }>
			<Edit { ...props } />
		</BlockEditContextProvider>
	);
}
