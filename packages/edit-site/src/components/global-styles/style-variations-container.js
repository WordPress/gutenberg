/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo, useContext, useState } from '@wordpress/element';
import { ENTER } from '@wordpress/keycodes';
import {
	__experimentalHeading as Heading,
	__experimentalGrid as Grid,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { mergeBaseAndUserConfigs } from './global-styles-provider';
import StylesPreview from './preview';
import { unlock } from '../../lock-unlock';

function cloneDeep( object ) {
	return ! object ? {} : JSON.parse( JSON.stringify( object ) );
}

const filterObjectByProperty = ( object, property ) => {
	const newObject = {};
	Object.keys( object ).forEach( ( key ) => {
		if ( key === property ) {
			newObject[ key ] = object[ key ];
		} else if ( typeof object[ key ] === 'object' ) {
			const newFilter = filterObjectByProperty( object[ key ], property );
			if ( Object.keys( newFilter ).length ) {
				newObject[ key ] = newFilter;
			}
		}
	} );
	return newObject;
};

const removePropertyFromObject = ( object, property ) => {
	for ( const key in object ) {
		if ( key === property ) {
			delete object[ key ];
		} else if ( typeof object[ key ] === 'object' ) {
			removePropertyFromObject( object[ key ], property );
		}
	}
	return object;
};

const getVariationsByType = ( user, variations, type ) => {
	const userSettingsWithoutType = removePropertyFromObject(
		cloneDeep( user ),
		type
	);

	const variationsWithOnlyType = variations.map( ( variation ) => {
		return filterObjectByProperty( variation, type );
	} );

	return variationsWithOnlyType.map( ( variation ) =>
		mergeBaseAndUserConfigs( userSettingsWithoutType, variation )
	);
};

const { GlobalStylesContext, areGlobalStyleConfigsEqual } = unlock(
	blockEditorPrivateApis
);

function Variation( { variation, isColor, isFont } ) {
	const [ isFocused, setIsFocused ] = useState( false );
	const { base, user, setUserConfig } = useContext( GlobalStylesContext );
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

	const isActive = useMemo( () => {
		return areGlobalStyleConfigsEqual( user, variation );
	}, [ user, variation ] );

	let label = variation?.title;
	if ( variation?.description ) {
		label = sprintf(
			/* translators: %1$s: variation title. %2$s variation description. */
			__( '%1$s (%2$s)' ),
			variation?.title,
			variation?.description
		);
	}

	return (
		<GlobalStylesContext.Provider value={ context }>
			<div
				className={ classnames(
					'edit-site-global-styles-variations_item',
					{
						'is-active': isActive,
					}
				) }
				role="button"
				onClick={ selectVariation }
				onKeyDown={ selectOnEnter }
				tabIndex="0"
				aria-label={ label }
				aria-current={ isActive }
				onFocus={ () => setIsFocused( true ) }
				onBlur={ () => setIsFocused( false ) }
			>
				<div className="edit-site-global-styles-variations_item-preview">
					<StylesPreview
						label={ variation?.title }
						isFocused={ isFocused }
						withHoverView
						isColor={ isColor }
						isFont={ isFont }
					/>
				</div>
			</div>
		</GlobalStylesContext.Provider>
	);
}

export default function StyleVariationsContainer() {
	const variations = useSelect( ( select ) => {
		return select(
			coreStore
		).__experimentalGetCurrentThemeGlobalStylesVariations();
	}, [] );

	const withEmptyVariation = useMemo( () => {
		return [
			{
				title: __( 'Default' ),
				settings: {},
				styles: {},
			},
			...( variations ?? [] ).map( ( variation ) => ( {
				...variation,
				settings: variation.settings ?? {},
				styles: variation.styles ?? {},
			} ) ),
		];
	}, [ variations ] );

	const { user } = useContext( GlobalStylesContext );

	const typographyVariations =
		variations && getVariationsByType( user, variations, 'typography' );
	const colorVariations =
		variations && getVariationsByType( user, variations, 'color' );

	return (
		<>
			<Grid
				columns={ 2 }
				className="edit-site-global-styles-style-variations-container"
			>
				{ withEmptyVariation.map( ( variation, index ) => (
					<Variation key={ index } variation={ variation } />
				) ) }
			</Grid>
			<div className="edit-site-sidebar-navigation-screen-styles__group-header">
				<Heading level={ 2 }>{ __( 'Colors' ) }</Heading>
			</div>
			<Grid
				columns={ 2 }
				className="edit-site-global-styles-style-variations-container"
			>
				{ colorVariations &&
					colorVariations.map( ( variation, index ) => (
						<Variation
							key={ index }
							variation={ variation }
							isFont={ false }
						/>
					) ) }
			</Grid>
			<div className="edit-site-sidebar-navigation-screen-styles__group-header">
				<Heading level={ 2 }>{ __( 'Typography' ) }</Heading>
			</div>
			<Grid
				columns={ 2 }
				className="edit-site-global-styles-style-variations-container"
			>
				{ typographyVariations &&
					typographyVariations.map( ( variation, index ) => (
						<Variation
							key={ index }
							variation={ variation }
							isColor={ false }
						/>
					) ) }
			</Grid>
		</>
	);
}
