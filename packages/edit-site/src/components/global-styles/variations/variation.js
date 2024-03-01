/**
 * WordPress dependencies
 */
import { useMemo, useContext, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { Button, Icon } from '@wordpress/components';
import { check } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { mergeBaseAndUserConfigs } from '../global-styles-provider';
import { unlock } from '../../../lock-unlock';

const { GlobalStylesContext, areGlobalStyleConfigsEqual } = unlock(
	blockEditorPrivateApis
);

export default function Variation( {
	variation,
	children,
	shouldShowTooltip = true,
} ) {
	const [ isFocused, setIsFocused ] = useState( false );
	const { base, user, setUserConfig } = useContext( GlobalStylesContext );
	const context = useMemo(
		() => ( {
			user: {
				settings: variation.settings ?? {},
				styles: variation.styles ?? {},
			},
			base,
			merged: mergeBaseAndUserConfigs( base, variation ),
			setUserConfig: () => {},
		} ),
		[ variation, base ]
	);

	const selectVariation = () => {
		setUserConfig( () => ( {
			settings: variation.settings,
			styles: variation.styles,
		} ) );
	};

	const isActive = useMemo(
		() => areGlobalStyleConfigsEqual( user, variation ),
		[ user, variation ]
	);

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
			<Button
				className="edit-site-global-styles-variations_item"
				onClick={ selectVariation }
				label={ label }
				aria-current={ isActive }
				onFocus={ () => setIsFocused( true ) }
				onBlur={ () => setIsFocused( false ) }
				showTooltip={ shouldShowTooltip }
			>
				<span className="edit-site-global-styles-variations_item-preview">
					{ children( isFocused ) }
				</span>
				{ isActive && (
					<Icon
						icon={ check }
						size={ 16 }
						className="edit-site-global-styles-variations_active-icon"
					/>
				) }
			</Button>
		</GlobalStylesContext.Provider>
	);
}
