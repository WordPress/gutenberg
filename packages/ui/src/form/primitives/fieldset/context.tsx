import { createContext, useContext } from '@wordpress/element';

type FieldsetContextType = {
	registerDescriptionId: ( id: string ) => void;
	unregisterDescriptionId: () => void;
};

const fallbackContext: FieldsetContextType = {
	registerDescriptionId: () => {},
	unregisterDescriptionId: () => {},
};

export const FieldsetContext = createContext< FieldsetContextType | null >(
	null
);

export const useFieldsetContext = (
	componentName: 'Fieldset.Description' | 'Fieldset.Details'
) => {
	const context = useContext( FieldsetContext );

	if ( process.env.NODE_ENV !== 'production' && ! context ) {
		throw new Error(
			`${ componentName }: Missing parent <Fieldset.Root>. Render <${ componentName }> inside <Fieldset.Root>.`
		);
	}

	return context ?? fallbackContext;
};
