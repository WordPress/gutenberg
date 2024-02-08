/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useMemo, useContext } from '@wordpress/element';
import { ENTER } from '@wordpress/keycodes';
import {
	__experimentalGrid as Grid,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalZStack as ZStack,
	ColorIndicator,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { mergeBaseAndUserConfigs } from './global-styles-provider';
import { unlock } from '../../lock-unlock';
import ColorIndicatorWrapper from './color-indicator-wrapper';
import Subtitle from './subtitle';

const { GlobalStylesContext, areGlobalStyleConfigsEqual } = unlock(
	blockEditorPrivateApis
);

function ColorVariation( { variation } ) {
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

	const colors = variation?.settings?.color?.palette?.theme ?? [];

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
			>
				<div className="edit-site-global-styles-variations_item-preview is-color-variation">
					<HStack
						direction={
							colors.length === 0 ? 'row-reverse' : 'row'
						}
						justify="center"
					>
						<ZStack isLayered={ false } offset={ -8 }>
							{ colors
								.slice( 0, 5 )
								.map( ( { color }, index ) => (
									<ColorIndicatorWrapper
										key={ `${ color }-${ index }` }
									>
										<ColorIndicator colorValue={ color } />
									</ColorIndicatorWrapper>
								) ) }
						</ZStack>
					</HStack>
				</div>
			</div>
		</GlobalStylesContext.Provider>
	);
}

export default function ColorVariations( { variations } ) {
	return (
		<VStack spacing={ 3 }>
			<Subtitle level={ 3 }>{ __( 'Presets' ) }</Subtitle>
			<Grid
				columns={ 2 }
				className="edit-site-global-styles-color-variations"
			>
				{ variations.map( ( variation, index ) => {
					return (
						<ColorVariation key={ index } variation={ variation } />
					);
				} ) }
			</Grid>
		</VStack>
	);
}
