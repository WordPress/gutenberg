package org.wordpress.mobile.ReactNativeAztec;

import androidx.annotation.NonNull;
import androidx.annotation.VisibleForTesting;

import org.jetbrains.annotations.NotNull;
import org.wordpress.aztec.spans.UnknownHtmlSpan;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

class IllegalSelectionIndexException extends Exception {
    IllegalSelectionIndexException(int selectionStart, int selectionEnd, int textLength, ReactAztecText view) {
        super(createMessage(selectionStart, selectionEnd, textLength, getUnknownHtmlTags(view, textLength)));
    }

    private static String createMessage(int selectionStart,
                                        int selectionEnd,
                                        int textLength,
                                        List<String> unknownHtmlTags) {
        return "Illegal selection index for text with length " + textLength +
               ", selectionStart: " + selectionStart +
               ", selectionEnd: " + selectionEnd +
               ", with " + UnknownHtmlSpan.class.getSimpleName() + " tags: " + unknownHtmlTags;
    }

    @NotNull
    private static List<String> getUnknownHtmlTags(ReactAztecText view, int textLength) {
        List<String> unknownHtmlTags = new ArrayList<>();
        for (UnknownHtmlSpan span : view.getText().getSpans(0, textLength, UnknownHtmlSpan.class)) {
            String rawHtml = span.getRawHtml().toString();
            unknownHtmlTags.addAll(parseTags(rawHtml));
        }
        return unknownHtmlTags;
    }

    @VisibleForTesting
    @NonNull
    static List<String> parseTags(String html) {
        List<String> tags = new ArrayList<>();
        Matcher matcher = Pattern.compile("<([^\\\\s>/]+)>").matcher(html);
        while (matcher.find()) {
            tags.add(matcher.group(1));
        }
        return tags;
    }
}
