/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo, useContext } from '@wordpress/element';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import { parseUserGlobalStyles } from './global-styles-provider';
import { GlobalStylesContext } from './context';

function Variation( { variation } ) {
	const config = useMemo( () => {
		return parseUserGlobalStyles( variation.content.raw );
	}, [ variation.content.raw ] );
	const { setUserConfig } = useContext( GlobalStylesContext );

	const selectVariation = () => {
		setUserConfig( () => {
			return config;
		} );
	};

	return (
		<Button onClick={ selectVariation }>
			{ variation.title.rendered }
		</Button>
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

	return variations
		.filter( ( variation ) => variation.id !== globalStylesId )
		.map( ( variation ) => (
			<Variation key={ variation.id } variation={ variation } />
		) );
}

export default Variations;
