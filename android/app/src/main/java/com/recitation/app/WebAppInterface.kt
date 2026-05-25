package com.recitation.app

import android.app.Activity
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.webkit.JavascriptInterface
import android.webkit.WebView
import java.util.Locale

class WebAppInterface(
    private val activity: Activity,
    private val db: RecitationDatabase
) {
    private var speechRecognizer: SpeechRecognizer? = null
    private var tts: TextToSpeech? = null
    private var webView: WebView? = null
    private var recognitionCallback: String? = null
    private var isListening = false

    fun setWebView(wv: WebView) {
        webView = wv
    }

    // ========== TTS (文字转语音) ==========

    @JavascriptInterface
    fun speak(text: String) {
        activity.runOnUiThread {
            if (tts == null) {
                tts = TextToSpeech(activity) { status ->
                    if (status == TextToSpeech.SUCCESS) {
                        tts?.language = Locale.CHINESE
                        speakNow(text)
                    }
                }
            } else {
                speakNow(text)
            }
        }
    }

    private fun speakNow(text: String) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, null)
        } else {
            @Suppress("DEPRECATION")
            tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null)
        }
    }

    @JavascriptInterface
    fun stopSpeaking() {
        tts?.stop()
    }

    // ========== 语音识别 (STT) ==========

    @JavascriptInterface
    fun startListening(lang: String, callback: String) {
        recognitionCallback = callback
        activity.runOnUiThread {
            if (isListening) return@runOnUiThread
            isListening = true

            if (speechRecognizer == null) {
                speechRecognizer = SpeechRecognizer.createSpeechRecognizer(activity)
                speechRecognizer?.setRecognitionListener(object : RecognitionListener {
                    override fun onReadyForSpeech(params: Bundle?) {}
                    override fun onBeginningOfSpeech() {}
                    override fun onRmsChanged(rmsdB: Float) {}
                    override fun onBufferReceived(buffer: ByteArray?) {}
                    override fun onEndOfSpeech() {
                        isListening = false
                    }
                    override fun onError(error: Int) {
                        isListening = false
                        val msg = when (error) {
                            SpeechRecognizer.ERROR_NO_MATCH -> "没有听清"
                            SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "超时"
                            else -> "识别出错"
                        }
                        webView?.post {
                            webView?.evaluateJavascript(
                                "if(window.$callback) window.$callback(JSON.stringify({error:'$msg'}))", null
                            )
                        }
                    }
                    override fun onResults(results: Bundle?) {
                        isListening = false
                        val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        val text = matches?.firstOrNull() ?: ""
                        webView?.post {
                            webView?.evaluateJavascript(
                                "if(window.${recognitionCallback}) window.${recognitionCallback}(JSON.stringify({text:'${text.replace("'", "\\'")}'}))", null
                            )
                        }
                    }
                    override fun onPartialResults(partialResults: Bundle?) {}
                    override fun onEvent(eventType: Int, params: Bundle?) {}
                })
            }

            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang)
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
            }
            speechRecognizer?.startListening(intent)
        }
    }

    @JavascriptInterface
    fun stopListening() {
        isListening = false
        speechRecognizer?.stopListening()
    }

    @JavascriptInterface
    fun isSpeechAvailable(): Boolean {
        return SpeechRecognizer.isRecognitionAvailable(activity)
    }

    // ========== 数据库操作 ==========

    @JavascriptInterface
    fun listTexts(subject: String?): String = db.listTexts(subject)

    @JavascriptInterface
    fun getText(id: Long): String? = db.getText(id)

    @JavascriptInterface
    fun createText(subjectId: Int, title: String, content: String, source: String, grade: String, tags: String): Long {
        return db.createText(subjectId, title, content, source, grade, tags)
    }

    @JavascriptInterface
    fun updateText(id: Long, title: String, content: String, grade: String, tags: String) {
        db.updateText(id, title, content, grade, tags)
    }

    @JavascriptInterface
    fun deleteText(id: Long) {
        db.deleteText(id)
    }

    @JavascriptInterface
    fun createAttempt(textId: Long, spokenSentences: String, score: Double, results: String, durationSec: Int): Long {
        return db.createAttempt(textId, spokenSentences, score, results, durationSec)
    }

    @JavascriptInterface
    fun getAttemptHistory(textId: Long): String = db.getAttemptHistory(textId)

    @JavascriptInterface
    fun getMistakeStats(): String = db.getMistakeStats()

    @JavascriptInterface
    fun getMistakeRankings(): String = db.getMistakeRankings()

    @JavascriptInterface
    fun addMistake(textId: Long, sentenceIndex: Int, word: String) {
        db.addMistake(textId, sentenceIndex, word)
    }

    @JavascriptInterface
    fun clearMistakes() {
        db.clearMistakes()
    }

    // ========== 系统功能 ==========

    @JavascriptInterface
    fun getVersion(): String = "1.0.0"
}
