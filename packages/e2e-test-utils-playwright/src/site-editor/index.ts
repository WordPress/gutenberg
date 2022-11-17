/**
 * External dependencies
 */
import type { Page } from '@playwright/test';

/**
 * Internal dependencies
 */
import { enterEditMode } from './toggle-canvas-mode';

type AdminConstructorProps = {
	page: Page;
};

export class SiteEditor {
	page: Page;

	constructor( { page }: AdminConstructorProps ) {
		this.page = page;
	}

	enterEditMode = enterEditMode.bind( this );
}
