package com.gutenberg.benchmark

import android.content.Intent
import androidx.benchmark.macro.FrameTimingMetric
import androidx.benchmark.macro.StartupMode
import androidx.benchmark.macro.junit4.MacrobenchmarkRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.uiautomator.*
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import java.lang.Thread.sleep

@RunWith(AndroidJUnit4::class)
class FrameBenchmarks {
    @get:Rule
    val benchmarkRule = MacrobenchmarkRule()

    private val lastBlockText = "This is the last block"
    private val iterations = 10

    @Test
    fun scrollToEnd_example_content() = benchmarkRule.measureRepeated(
        packageName = "com.gutenberg",
        metrics = listOf(FrameTimingMetric()),
        iterations = iterations,
        startupMode = StartupMode.COLD
    ) {
        pressHome()
        startActivityAndWait {
            val initialContent = BuildConfig.EXAMPLE_CONTENT + Block.heading(lastBlockText)
            setInitialContent(it, initialContent)
        }
        device.waitForIdle()
        sleep(1000)
        scrollToEnd(device, lastBlockText)
    }

    @Test
    fun scrollToEnd_longPost_100_images() = benchmarkRule.measureRepeated(
        packageName = "com.gutenberg",
        metrics = listOf(FrameTimingMetric()),
        iterations = iterations,
        startupMode = StartupMode.COLD
    ) {
        pressHome()
        startActivityAndWait {
            val initialContent = Block.blocks(100, Block.image) + Block.paragraph(lastBlockText)
            setInitialContent(it, initialContent)
        }
        device.waitForIdle()
        sleep(1000)
        scrollToEnd(device, lastBlockText)
    }

    @Test
    fun scrollToEnd_longPost_500_paragraphs() = benchmarkRule.measureRepeated(
        packageName = "com.gutenberg",
        metrics = listOf(FrameTimingMetric()),
        iterations = iterations,
        startupMode = StartupMode.COLD
    ) {
        pressHome()
        startActivityAndWait {
            val initialContent = Block.paragraphs(500) + Block.paragraph(lastBlockText)
            setInitialContent(it, initialContent)
        }
        device.waitForIdle()
        sleep(1000)
        scrollToEnd(device, lastBlockText)
    }

    @Test
    fun tapBetweenParagraphBlocks() = benchmarkRule.measureRepeated(
        packageName = "com.gutenberg",
        metrics = listOf(FrameTimingMetric()),
        iterations = iterations,
        startupMode = StartupMode.COLD
    ) {
        pressHome()
        startActivityAndWait {
            setInitialContent(it, Block.paragraphs(5))
        }
        device.waitForIdle()

        // Without this, the test fails to find the first block
        sleep(1000)

        val tapOnBlock = { text: String ->
            // select block
            val block = device.findObject(By.text(text))
            block.click()
            device.waitForIdle()

            // This seems to be needed. Not sure why.
            sleep(1000)

            // dismiss keyboard
            // In addition to capturing performance around showing and hiding the keyboard,
            // dismissing the keyboard also ensures that the "next" block is always visible
            // on the screen
            device.pressBack()
            device.waitForIdle()

        }

        tapOnBlock("0")
        tapOnBlock("4")
        tapOnBlock("1")
        tapOnBlock("3")
        tapOnBlock("2")
    }

    // scrollable.flingToEnd() doesn't seem to work here because it would prematurely think
    // it got to the end of the list when the app was busy loading more data into the list
    private fun scrollToEnd(device: UiDevice, lastBlockText: String, steps: Int = 5) {
        val scrollable = UiScrollable(UiSelector().scrollable(true))
        while (device.findObject(By.text(lastBlockText)) == null) {
            scrollable.scrollForward(steps)
        }
    }

    private fun setInitialContent(intent: Intent, initialContent: String) {
        intent.putExtra("bundle_initial_data", initialContent)
    }

    class Block {
        companion object {
            fun heading(text: String, level: Int = 1) =
                "<!-- wp:heading {\"level\":$level} --><h$level>$text</h$level><!-- /wp:heading -->"

            const val image =
                "<!-- wp:image -->" +
                        "<figure class=\"wp-block-image\">" +
                        "<img src=\"https://cldup.com/cXyG__fTLN.jpg\" alt=\"\"/>" +
                        "<figcaption>Mountain</figcaption>" +
                        "</figure>" +
                        "<!-- /wp:image -->\n"

            fun paragraph(text: String) =
                "<!-- wp:paragraph --><p>$text</p><!-- /wp:paragraph -->"

            fun paragraphs(number: Int): String {
                val result = StringBuilder()
                repeat(number) {
                    result.append(paragraph(it.toString()))
                }
                return result.toString()
            }

            fun blocks(number: Int, block: String): String {
                val result = StringBuilder()
                repeat(number) {
                    result.append(block)
                }
                return result.toString()
            }
        }
    }
}
