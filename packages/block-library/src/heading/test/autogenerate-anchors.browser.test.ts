import { describe, expect, it } from 'vitest';
import { generateAnchor } from '../autogenerate-anchors';

describe( 'generateAnchor()', () => {
	it( 'keeps the combining marks of scripts that need them', () => {
		expect( generateAnchor( 'hindi', 'हिंदी व्याकरण' ) ).toBe(
			'हिंदी-व्याकरण'
		);
		expect(
			generateAnchor( 'hindi-long', 'अलग-अलग प्रकार के प्लंबिंग ट्रैप्स' )
		).toBe( 'अलग-अलग-प्रकार-के-प्लंबिंग-ट्रैप्स' );
		expect( generateAnchor( 'tamil', 'தமிழ் மொழி' ) ).toBe( 'தமிழ்-மொழி' );
		expect( generateAnchor( 'bengali', 'বাংলা ভাষা' ) ).toBe(
			'বাংলা-ভাষা'
		);
	} );

	it( 'does not keep emoji variation selectors or enclosing marks', () => {
		expect( generateAnchor( 'heart', 'I ❤️ WordPress' ) ).toBe(
			'i-wordpress'
		);
		expect( generateAnchor( 'check', 'Top 10 ✔️ tips' ) ).toBe(
			'top-10-tips'
		);
		expect( generateAnchor( 'copyright', '©️ notice' ) ).toBe( 'notice' );
		expect( generateAnchor( 'keycap', '1️⃣ step' ) ).toBe( '1-step' );
	} );

	it( 'removes Latin accents, including decomposed ones', () => {
		expect( generateAnchor( 'latin', 'Crème Brûlée' ) ).toBe(
			'creme-brulee'
		);
		expect(
			generateAnchor(
				'latin-decomposed',
				'Cre\u0300me Bru\u0302le\u0301e'
			)
		).toBe( 'creme-brulee' );
		expect( generateAnchor( 'english', 'Getting Started' ) ).toBe(
			'getting-started'
		);
	} );

	it( 'gives composed and decomposed text the same anchor', () => {
		expect( generateAnchor( 'greek-decomposed', 'Ελληνικα\u0301' ) ).toBe(
			generateAnchor( 'greek', 'Ελληνικ\u03ac' )
		);
	} );
} );
