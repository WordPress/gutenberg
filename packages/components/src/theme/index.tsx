/**
 * External dependencies
 */
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import type { ReactNode } from 'react';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../ui/context';

type ThemeProps = {
	accent?: string;
	children?: ReactNode;
};

const colors = ( { accent }: ThemeProps ) => {
	const accentColor = accent
		? css`
				--wp-admin-theme-color: ${ accent };
		  `
		: undefined;

	return accentColor;
};

const Wrapper = styled.div`
	${ colors }
`;

function Theme( props: WordPressComponentProps< ThemeProps, 'div', true > ) {
	return <Wrapper { ...props } />;
}

export default Theme;
