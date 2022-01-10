/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo, useContext } from '@wordpress/element';
import { ENTER } from '@wordpress/keycodes';
import {
	__experimentalGrid as Grid,
	Card,
	CardBody,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { mergeBaseAndUserConfigs } from './global-styles-provider';
import { GlobalStylesContext } from './context';
import StylesPreview from './preview';
import ScreenHeader from './header';

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
			<StylesPreview
				className="edit-site-global-styles-variations_item"
				role="button"
				onClick={ selectVariation }
				onKeyDown={ selectOnEnter }
			/>
		</GlobalStylesContext.Provider>
	);
}

function ScreenStyleVariations() {
	const { variations } = useSelect( ( select ) => {
		return {
			variations: select(
				coreStore
			).__experimentalGetCurrentThemeGlobalStylesVariations(),
		};
	}, [] );

	return (
		<>
			<ScreenHeader
				back="/"
				title={ __( 'Other styles' ) }
				description={ __(
					'Choose a different style combination for the theme styles'
				) }
			/>

			<Card size="small" isBorderless>
				<CardBody>
					<Grid columns={ 2 }>
						{ variations?.map( ( variation, index ) => (
							<Variation key={ index } variation={ variation } />
						) ) }
					</Grid>
				</CardBody>
			</Card>
		</>
	);
}

export default ScreenStyleVariations;
