import clsx from 'clsx';
import { Fieldset as _Fieldset } from '@base-ui/react/fieldset';
import { forwardRef, useState, useMemo } from '@wordpress/element';
import styles from './style.module.css';
import { FieldsetContext } from './context';
import type { FieldsetRootProps } from './types';

export const FieldsetRoot = forwardRef<
	HTMLFieldSetElement,
	FieldsetRootProps
>( function FieldsetRoot( { className, children, ...restProps }, ref ) {
	const [ descriptionId, setDescriptionId ] = useState< string >();

	const contextValue = useMemo(
		() => ( {
			registerDescriptionId: ( id: string ) => setDescriptionId( id ),
			unregisterDescriptionId: () => setDescriptionId( undefined ),
		} ),
		[]
	);

	return (
		<FieldsetContext.Provider value={ contextValue }>
			<_Fieldset.Root
				ref={ ref }
				className={ clsx( styles.root, className ) }
				// Certain screen readers may not read a fieldset's description
				// https://w3c.github.io/using-aria/#label-support
				aria-describedby={ descriptionId }
				{ ...restProps }
			>
				{ children }
			</_Fieldset.Root>
		</FieldsetContext.Provider>
	);
} );
