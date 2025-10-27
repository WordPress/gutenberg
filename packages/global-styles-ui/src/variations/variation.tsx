/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { Tooltip } from '@wordpress/components';
import { useMemo, useContext, useState } from '@wordpress/element';
import { ENTER } from '@wordpress/keycodes';
import { _x, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { GlobalStylesContext } from '../context';
import { areGlobalStyleConfigsEqual, filterObjectByProperties } from '../utils';

interface VariationProps {
	variation: any;
	children: ( isFocused: boolean ) => React.ReactNode;
	isPill?: boolean;
	properties?: string[];
	showTooltip?: boolean;
}

export default function Variation( {
	variation,
	children,
	isPill = false,
	properties,
	showTooltip = false,
}: VariationProps ) {
	const [ isFocused, setIsFocused ] = useState( false );
	const {
		base,
		user,
		onChange: setUserConfig,
	} = useContext( GlobalStylesContext );

	const context = useMemo( () => {
		let merged = { ...base, ...variation };
		if ( properties ) {
			merged = filterObjectByProperties( merged, properties );
		}
		return {
			user: variation,
			base,
			merged,
			onChange: () => {},
		};
	}, [ variation, base, properties ] );

	const selectVariation = () => setUserConfig( variation );

	const selectOnEnter = ( event: React.KeyboardEvent ) => {
		if ( event.keyCode === ENTER ) {
			event.preventDefault();
			selectVariation();
		}
	};

	const isActive = useMemo(
		() => areGlobalStyleConfigsEqual( user, variation ),
		[ user, variation ]
	);

	let label = variation?.title;
	if ( variation?.description ) {
		label = sprintf(
			/* translators: 1: variation title. 2: variation description. */
			_x( '%1$s (%2$s)', 'variation label' ),
			variation?.title,
			variation?.description
		);
	}

	const content = (
		<div
			className={ clsx( 'global-styles-ui-variations_item', {
				'is-active': isActive,
			} ) }
			role="button"
			onClick={ selectVariation }
			onKeyDown={ selectOnEnter }
			tabIndex={ 0 }
			aria-label={ label }
			aria-current={ isActive }
			onFocus={ () => setIsFocused( true ) }
			onBlur={ () => setIsFocused( false ) }
		>
			<div
				className={ clsx( 'global-styles-ui-variations_item-preview', {
					'is-pill': isPill,
				} ) }
			>
				{ children( isFocused ) }
			</div>
		</div>
	);

	return (
		<GlobalStylesContext.Provider value={ context }>
			{ showTooltip ? (
				<Tooltip text={ variation?.title }>{ content }</Tooltip>
			) : (
				content
			) }
		</GlobalStylesContext.Provider>
	);
}
