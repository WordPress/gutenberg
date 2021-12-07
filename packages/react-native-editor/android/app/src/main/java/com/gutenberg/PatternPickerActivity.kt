package com.gutenberg

import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle

class PatternPickerActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.pattern_picker_activity)
//        if (savedInstanceState == null) {
//            supportFragmentManager.beginTransaction()
//                .replace(R.id.container, PatternPickerFragment())
//                .commitNow()
//        }
    }
}
