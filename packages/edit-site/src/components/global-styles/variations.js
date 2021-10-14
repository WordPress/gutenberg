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
import { store as editSiteStore } from '../../store';
import {
	mergeBaseAndUserConfigs,
	parseUserGlobalStyles,
} from './global-styles-provider';
import { GlobalStylesContext } from './context';
import StylesPreview from './preview';

function Variation( { variation } ) {
	const { base, setUserConfig } = useContext( GlobalStylesContext );
	const config = useMemo( () => {
		return parseUserGlobalStyles( variation.content.raw );
	}, [ variation.content.raw ] );
	const context = useMemo( () => {
		return {
			user: config,
			base,
			merged: mergeBaseAndUserConfigs( base, config ),
			setUserConfig: () => {},
		};
	}, [ config, base ] );

	const selectVariation = () => {
		setUserConfig( () => {
			return config;
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
			<StylesPreview
				role="button"
				onClick={ selectVariation }
				onKeyDown={ selectOnEnter }
			/>
		</GlobalStylesContext.Provider>
	);
}

function Variations() {
	const { variations, globalStylesId } = useSelect( ( select ) => {
		const _globalStylesId = select( editSiteStore ).getSettings()
			.__experimentalGlobalStylesUserEntityId;
		return {
			variations: select( coreStore ).getEntityRecords(
				'postType',
				'wp_global_styles'
			),
			globalStylesId: _globalStylesId,
		};
	}, [] );

	if ( ! variations?.length ) {
		return 'loading...';
	}

	return (
		<VStack spacing={ 3 }>
			{ variations
				.filter( ( variation ) => variation.id !== globalStylesId )
				.map( ( variation ) => (
					<Variation key={ variation.id } variation={ variation } />
				) ) }
		</VStack>
	);
}

export default Variations;
