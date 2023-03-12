/**
 * External dependencies
 */
import classnames from 'classnames';
import fastDeepEqual from 'fast-deep-equal/es6';

/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo, useContext, useState } from '@wordpress/element';
import { ENTER } from '@wordpress/keycodes';
import { __experimentalGrid as Grid } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { useAsyncList } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { mergeBaseAndUserConfigs } from './global-styles-provider';
import StylesPreview from './preview';
import { unlock } from '../../private-apis';

const { GlobalStylesContext } = unlock( blockEditorPrivateApis );

function compareVariations( a, b ) {
	return (
		fastDeepEqual( a.styles, b.styles ) &&
		fastDeepEqual( a.settings, b.settings )
	);
}

function Variation( { variation, onVariationClick } ) {
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
		if ( onVariationClick ) {
			onVariationClick( variation );
		}
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
		return compareVariations( user, variation );
	}, [ user, variation ] );

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
				aria-label={ variation?.title }
				aria-current={ isActive }
				onFocus={ () => setIsFocused( true ) }
				onBlur={ () => setIsFocused( false ) }
			>
				<div className="edit-site-global-styles-variations_item-preview">
					<StylesPreview
						label={ variation?.title }
						isFocused={ isFocused }
						withHoverView
					/>
				</div>
			</div>
		</GlobalStylesContext.Provider>
	);
}

export default function StyleVariationsContainer( {
	variations,
	gridColumns = 2,
	onVariationClick,
} ) {
	const variationsInput = useSelect(
		( select ) => {
			if ( variations ) {
				return variations;
			}
			return (
				select(
					coreStore
				).__experimentalGetCurrentThemeGlobalStylesVariations() || []
			);
		},
		[ variations ]
	);

	const withEmptyVariation = useMemo( () => {
		return [
			{
				title: __( 'Default' ),
				settings: {},
				styles: {},
			},
			...variationsInput.map( ( variation ) => ( {
				...variation,
				settings: variation.settings ?? {},
				styles: variation.styles ?? {},
			} ) ),
		];
	}, [ variationsInput ] );

	const currentWithEmptyVariation = useAsyncList( withEmptyVariation );

	return (
		<>
			<Grid
				columns={ gridColumns }
				className="edit-site-global-styles-style-variations-container"
			>
				{ currentWithEmptyVariation?.map( ( variation, index ) => (
					<Variation
						key={ index }
						variation={ variation }
						onVariationClick={ onVariationClick }
					/>
				) ) }
			</Grid>
		</>
	);
}
