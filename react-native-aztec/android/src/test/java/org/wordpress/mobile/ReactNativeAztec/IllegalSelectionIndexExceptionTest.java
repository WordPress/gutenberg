package org.wordpress.mobile.ReactNativeAztec;

import org.junit.Test;

import java.util.Collections;
import java.util.List;

import static org.junit.Assert.assertEquals;

public class IllegalSelectionIndexExceptionTest {

    @Test
    public void getHtmlTag_returns_only_tag() {
        List<String> actual = IllegalSelectionIndexException.parseTags("hi <mark>there Bob</mark>. How are you?");
        List<String> expected = Collections.singletonList("mark");
        assertEquals(expected, actual);
    }
}