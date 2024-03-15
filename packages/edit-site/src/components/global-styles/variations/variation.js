/**
 * WordPress dependencies
 */
import { useMemo, useContext, useState } from '@wordpress/element';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { Button, Icon } from '@wordpress/components';
import { check } from '@wordpress/icons';
import { useInstanceId } from '@wordpress/compose';

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
	const instanceId = useInstanceId(
		Variation,
		'edit-site-global-styles-variations_item'
	);
	const descriptionId = variation?.description ? instanceId : undefined;
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

	return (
		<GlobalStylesContext.Provider value={ context }>
			<Button
				className="edit-site-global-styles-variations_item"
				onClick={ selectVariation }
				label={ variation?.title }
				aria-current={ isActive }
				onFocus={ () => setIsFocused( true ) }
				onBlur={ () => setIsFocused( false ) }
				showTooltip={ shouldShowTooltip }
				aria-describedby={ descriptionId }
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
			{ descriptionId && (
				<div hidden id={ descriptionId }>
					{ variation?.description }
				</div>
			) }
		</GlobalStylesContext.Provider>
	);
}
