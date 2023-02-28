/**
 * WordPress dependencies
 */
import { EnvironmentContext, forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useBlockProps } from '../block-list/use-block-props';

const BlockRootEdit = forwardRef(
	( { as: Component = 'div', className, style, ...props }, ref ) => {
		const blockProps = useBlockProps( { ref, className, style } );
		return <Component { ...props } { ...blockProps } />;
	}
);

const BlockRootSave = ( {
	as: Component = 'div',
	className,
	style,
	...props
} ) => {
	const blockProps = useBlockProps.save( { className, style } );

	return <Component { ...props } { ...blockProps } />;
};

export const BlockRoot = forwardRef( ( props, ref ) => {
	// We can't use the `useContext` hook here because it isn't supported in the save environment.
	return (
		<EnvironmentContext.Consumer>
			{ ( env ) =>
				env === 'save' ? (
					<BlockRootSave { ...props } />
				) : (
					<BlockRootEdit ref={ ref } { ...props } />
				)
			}
		</EnvironmentContext.Consumer>
	);
} );
