/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentProps, KeyboardEvent } from 'react';

/**
 * Internal dependencies
 */
import LanguageChooser from '../';
import type { Language } from '../types';

function Component( props: ComponentProps< typeof LanguageChooser > ) {
	const onKeyDown = ( evt: KeyboardEvent< HTMLElement > ) => {
		evt.stopPropagation();
	};

	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div onKeyDown={ onKeyDown }>
			<LanguageChooser { ...props } />
			<p>
				Note: Typical storybook keyboard shortcuts are disabled for this
				story because they clash with the ones used by the component.
			</p>
		</div>
	);
}

const meta: Meta< typeof LanguageChooser > = {
	title: 'Language Chooser/Language Chooser',
	component: Component,
	parameters: {
		argTypes: {
			hasMissingTranslations: {
				options: [ false, true ],
				control: { type: 'radio' },
			},
			showOptionSiteDefault: {
				options: [ false, true ],
				control: { type: 'radio' },
			},
		},
		controls: { hideNoControlsWarning: true },
	},
};
export default meta;

/* eslint-disable camelcase */

const de_DE: Language = {
	locale: 'de_DE',
	nativeName: 'Deutsch',
	lang: 'de',
	installed: true,
};

const en_US: Language = {
	locale: 'en_US',
	nativeName: 'English (US)',
	lang: 'en',
	installed: true,
};

const en_GB: Language = {
	locale: 'en_GB',
	nativeName: 'English (UK)',
	lang: 'en',
	installed: true,
};

const fr_FR: Language = {
	locale: 'fr_FR',
	nativeName: 'Français',
	lang: 'fr',
	installed: true,
};

const de_CH: Language = {
	locale: 'de_CH',
	nativeName: 'Deutsch (Schweiz)',
	lang: 'de',
	installed: false,
};

const it_IT: Language = {
	locale: 'it_IT',
	nativeName: 'Italiano',
	lang: 'it',
	installed: false,
};

export const Default: StoryObj< typeof LanguageChooser > = {
	args: {
		defaultSelectedLanguages: [ de_DE, fr_FR ],
		allLanguages: [ de_DE, de_CH, it_IT, en_GB, fr_FR, en_US ],
	},
};

/* eslint-enable camelcase */
