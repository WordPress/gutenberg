/**
 * Internal dependencies
 */
import { useBlockEditContext } from '../block-edit';
import { useGlobalStyle } from '../global-styles';

export default function useStyle( path ) {
	const { name: blockName } = useBlockEditContext();
	const [ globalStyle ] = useGlobalStyle( path, blockName );
	return globalStyle;
}
