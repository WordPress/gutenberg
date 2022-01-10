/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo, useContext } from '@wordpress/element';
import { ENTER } from '@wordpress/keycodes';
import { __experimentalVStack as VStack } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { mergeBaseAndUserConfigs } from './global-styles-provider';
import { GlobalStylesContext } from './context';
import StylesPreview from './preview';

function Variation( { variation } ) {
	const { base, setUserConfig } = useContext( GlobalStylesContext );
	const context = useMemo( () => {
		return {
			user: {
				settings: variation.settings ?? {},
				styles: variation.styles ?? {},
			},
			base,
			merged: mergeBaseAndUserConfigs( base, variation ),
			setUserConfig: () => {},
		};
	}, [ variation, base ] );

	const selectVariation = () => {
		setUserConfig( () => {
			return {
				settings: variation.settings,
				styles: variation.styles,
			};
		} );
	};

	const selectOnEnter = ( event ) => {
		if ( event.keyCode === ENTER ) {
			event.preventDefault();
			selectVariation();
		}
	};

	return (
		<GlobalStylesContext.Provider value={ context }>
			<VStack spacing={ 2 }>
				<StylesPreview
					role="button"
					onClick={ selectVariation }
					onKeyDown={ selectOnEnter }
				/>
				<h3>{ variation.name }</h3>
			</VStack>
		</GlobalStylesContext.Provider>
	);
}

function Variations() {
	const { variations } = useSelect( ( select ) => {
		return {
			variations: select(
				coreStore
			).__experimentalGetCurrentThemeGlobalStylesVariations(),
		};
	}, [] );

	if ( ! variations?.length ) {
		return 'loading...';
	}

	return (
		<VStack spacing={ 3 }>
			{ variations.map( ( variation ) => (
				<Variation key={ variation.id } variation={ variation } />
			) ) }
		</VStack>
	);
}

export default Variations;
