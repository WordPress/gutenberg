package org.wordpress.mobile.WPAndroidGlue

import org.junit.Assert.assertEquals
import org.junit.Test
import org.wordpress.mobile.WPAndroidGlue.GutenbergProps.Companion.revertDeprecatedLanguageCode

class GutenbergPropsTest {

    // iw -> he
    @Test
    fun testHebrewLocaleConversions() {
        assertEquals("he-IL", revertDeprecatedLanguageCode("he-il"))
        assertEquals("he-IL", revertDeprecatedLanguageCode("iw-il"))
    }

    // in -> id
    @Test
    fun testIndonesianLocaleConversions() {
        assertEquals("id-ID", revertDeprecatedLanguageCode("id-id"))
        assertEquals("id-ID", revertDeprecatedLanguageCode("in-id"))
    }

    @Test
    fun testOtherLocaleConversionsDoNothing() {
        assertEquals("en-US", revertDeprecatedLanguageCode("en-us"))
        assertEquals("fr-FR", revertDeprecatedLanguageCode("fr-fr"))
    }
}
