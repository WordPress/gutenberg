/**
 * Internal dependencies
 */
import Edit from './edit';
import { useBlockEditContext } from './context';

/**
 * The `useBlockEditContext` hook provides information about the block this hook is being used in.
 * It returns an object with the `name`, `isSelected` state, and the `clientId` of the block.
 * It is useful if you want to create custom hooks that need access to the current blocks clientId
 * but don't want to rely on the data getting passed in as a parameter.
 *
 * @return {Object} Block edit context
 */
export { useBlockEditContext };

export default function BlockEdit( props ) {
	return <Edit { ...props } />;
}
