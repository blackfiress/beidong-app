package com.recitation.app

import android.content.ContentValues
import android.content.Context
import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import org.json.JSONArray
import org.json.JSONObject

class RecitationDatabase(context: Context) : SQLiteOpenHelper(
    context, "recitation.db", null, 1
) {
    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL("""
            CREATE TABLE IF NOT EXISTS subjects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                emoji TEXT NOT NULL DEFAULT '📖'
            )
        """)
        db.execSQL("""
            CREATE TABLE IF NOT EXISTS texts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                subject_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                source TEXT DEFAULT 'manual',
                grade TEXT DEFAULT '',
                tags TEXT DEFAULT '',
                created_at TEXT DEFAULT (datetime('now','localtime')),
                FOREIGN KEY (subject_id) REFERENCES subjects(id)
            )
        """)
        db.execSQL("""
            CREATE TABLE IF NOT EXISTS attempts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                text_id INTEGER NOT NULL,
                spoken_sentences TEXT NOT NULL DEFAULT '[]',
                score REAL DEFAULT 0,
                results TEXT DEFAULT '[]',
                duration_sec INTEGER DEFAULT 0,
                completed INTEGER DEFAULT 1,
                created_at TEXT DEFAULT (datetime('now','localtime')),
                FOREIGN KEY (text_id) REFERENCES texts(id)
            )
        """)
        db.execSQL("""
            CREATE TABLE IF NOT EXISTS mistakes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                text_id INTEGER NOT NULL,
                sentence_index INTEGER NOT NULL,
                word TEXT NOT NULL,
                count INTEGER DEFAULT 1,
                FOREIGN KEY (text_id) REFERENCES texts(id)
            )
        """)

        // 插入默认科目
        db.execSQL("INSERT OR IGNORE INTO subjects (id, name, emoji) VALUES (1, '语文', '🈁')")
        db.execSQL("INSERT OR IGNORE INTO subjects (id, name, emoji) VALUES (2, '英语', '🔤')")

        // 插入内置古诗文
        insertBuiltinTexts(db)
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {}

    private fun insertBuiltinTexts(db: SQLiteDatabase) {
        val texts = listOf(
            arrayOf(1, "静夜思", "床前明月光|疑是地上霜|举头望明月|低头思故乡", "一上"),
            arrayOf(1, "咏鹅", "鹅鹅鹅|曲项向天歌|白毛浮绿水|红掌拨清波", "一上"),
            arrayOf(1, "春晓", "春眠不觉晓|处处闻啼鸟|夜来风雨声|花落知多少", "一下"),
            arrayOf(1, "登鹳雀楼", "白日依山尽|黄河入海流|欲穷千里目|更上一层楼", "一下"),
            arrayOf(1, "悯农", "锄禾日当午|汗滴禾下土|谁知盘中餐|粒粒皆辛苦", "一下"),
            arrayOf(1, "望庐山瀑布", "日照香炉生紫烟|遥看瀑布挂前川|飞流直下三千尺|疑是银河落九天", "二上"),
            arrayOf(1, "赠汪伦", "李白乘舟将欲行|忽闻岸上踏歌声|桃花潭水深千尺|不及汪伦送我情", "二上"),
            arrayOf(1, "回乡偶书", "少小离家老大回|乡音无改鬓毛衰|儿童相见不相识|笑问客从何处来", "二上"),
            arrayOf(1, "草", "离离原上草|一岁一枯荣|野火烧不尽|春风吹又生", "二下"),
            arrayOf(1, "咏柳", "碧玉妆成一树高|万条垂下绿丝绦|不知细叶谁裁出|二月春风似剪刀", "二下"),
            arrayOf(1, "早发白帝城", "朝辞白帝彩云间|千里江陵一日还|两岸猿声啼不住|轻舟已过万重山", "三上"),
            arrayOf(1, "望天门山", "天门中断楚江开|碧水东流至此回|两岸青山相对出|孤帆一片日边来", "三上"),
            arrayOf(1, "绝句", "两个黄鹂鸣翠柳|一行白鹭上青天|窗含西岭千秋雪|门泊东吴万里船", "三下"),
            arrayOf(1, "元日", "爆竹声中一岁除|春风送暖入屠苏|千门万户曈曈日|总把新桃换旧符", "三下"),
            arrayOf(1, "题西林壁", "横看成岭侧成峰|远近高低各不同|不识庐山真面目|只缘身在此山中", "四上"),
            arrayOf(1, "暮江吟", "一道残阳铺水中|半江瑟瑟半江红|可怜九月初三夜|露似真珠月似弓", "四上"),
            arrayOf(1, "出塞", "秦时明月汉时关|万里长征人未还|但使龙城飞将在|不教胡马度阴山", "四上"),
            arrayOf(1, "四时田园杂兴", "昼出耘田夜绩麻|村庄儿女各当家|童孙未解供耕织|也傍桑阴学种瓜", "四下"),
            arrayOf(1, "示儿", "死去元知万事空|但悲不见九州同|王师北定中原日|家祭无忘告乃翁", "五上"),
            arrayOf(1, "己亥杂诗", "浩荡离愁白日斜|吟鞭东指即天涯|落红不是无情物|化作春泥更护花", "五上"),
            arrayOf(1, "竹石", "咬定青山不放松|立根原在破岩中|千磨万击还坚劲|任尔东西南北风", "六下"),
            arrayOf(1, "石灰吟", "千锤万凿出深山|烈火焚烧若等闲|粉骨碎身浑不怕|要留清白在人间", "六下"),
            arrayOf(1, "春夜喜雨", "好雨知时节|当春乃发生|随风潜入夜|润物细无声", "六下"),
        )
        for (t in texts) {
            db.execSQL(
                "INSERT OR IGNORE INTO texts (id, subject_id, title, content, source, grade) VALUES (?, 1, ?, ?, 'builtin', ?)",
                arrayOf(t[0], t[1], t[2], t[3])
            )
        }
    }

    // ========== API 方法 ==========

    fun listTexts(subject: String? = null): String {
        val sql = if (subject != null) {
            "SELECT t.*, s.name as subject_name, s.emoji as subject_emoji FROM texts t JOIN subjects s ON t.subject_id = s.id WHERE s.name = ? ORDER BY t.id"
        } else {
            "SELECT t.*, s.name as subject_name, s.emoji as subject_emoji FROM texts t JOIN subjects s ON t.subject_id = s.id ORDER BY t.id"
        }
        val args = if (subject != null) arrayOf(subject) else emptyArray()
        val cursor = readableDatabase.rawQuery(sql, args)
        val arr = JSONArray()
        while (cursor.moveToNext()) {
            val obj = JSONObject()
            obj.put("id", cursor.getInt(cursor.getColumnIndexOrThrow("id")))
            obj.put("subject_id", cursor.getInt(cursor.getColumnIndexOrThrow("subject_id")))
            obj.put("title", cursor.getString(cursor.getColumnIndexOrThrow("title")))
            obj.put("content", cursor.getString(cursor.getColumnIndexOrThrow("content")))
            obj.put("source", cursor.getString(cursor.getColumnIndexOrThrow("source")))
            obj.put("grade", cursor.getString(cursor.getColumnIndexOrThrow("grade")))
            obj.put("tags", cursor.getString(cursor.getColumnIndexOrThrow("tags")))
            obj.put("created_at", cursor.getString(cursor.getColumnIndexOrThrow("created_at")))
            obj.put("subject_name", cursor.getString(cursor.getColumnIndexOrThrow("subject_name")))
            obj.put("subject_emoji", cursor.getString(cursor.getColumnIndexOrThrow("subject_emoji")))

            // 计算平均分
            val avgCursor = readableDatabase.rawQuery(
                "SELECT COALESCE(AVG(score), 0) as avg FROM attempts WHERE text_id = ? AND completed = 1",
                arrayOf(obj.getLong("id").toString())
            )
            if (avgCursor.moveToFirst()) obj.put("avg_score", avgCursor.getDouble(0))
            avgCursor.close()

            // 尝试次数
            val cntCursor = readableDatabase.rawQuery(
                "SELECT COUNT(*) as cnt FROM attempts WHERE text_id = ? AND completed = 1",
                arrayOf(obj.getLong("id").toString())
            )
            if (cntCursor.moveToFirst()) obj.put("attempt_count", cntCursor.getInt(0))
            cntCursor.close()

            arr.put(obj)
        }
        cursor.close()
        return arr.toString()
    }

    fun getText(id: Long): String? {
        val cursor = readableDatabase.rawQuery(
            "SELECT t.*, s.name as subject_name, s.emoji as subject_emoji FROM texts t JOIN subjects s ON t.subject_id = s.id WHERE t.id = ?",
            arrayOf(id.toString())
        )
        if (!cursor.moveToFirst()) { cursor.close(); return null }
        val obj = JSONObject()
        obj.put("id", cursor.getInt(cursor.getColumnIndexOrThrow("id")))
        obj.put("subject_id", cursor.getInt(cursor.getColumnIndexOrThrow("subject_id")))
        obj.put("title", cursor.getString(cursor.getColumnIndexOrThrow("title")))
        obj.put("content", cursor.getString(cursor.getColumnIndexOrThrow("content")))
        obj.put("source", cursor.getString(cursor.getColumnIndexOrThrow("source")))
        obj.put("grade", cursor.getString(cursor.getColumnIndexOrThrow("grade")))
        obj.put("tags", cursor.getString(cursor.getColumnIndexOrThrow("tags")))
        obj.put("subject_name", cursor.getString(cursor.getColumnIndexOrThrow("subject_name")))
        obj.put("subject_emoji", cursor.getString(cursor.getColumnIndexOrThrow("subject_emoji")))
        // sentences
        val sentences = obj.getString("content").split("|").filter { it.isNotBlank() }
        val sentencesArr = JSONArray()
        for (s in sentences) sentencesArr.put(s)
        obj.put("sentences", sentencesArr)
        cursor.close()
        return obj.toString()
    }

    fun createText(subjectId: Int, title: String, content: String, source: String, grade: String, tags: String): Long {
        val cv = ContentValues()
        cv.put("subject_id", subjectId)
        cv.put("title", title)
        cv.put("content", content)
        cv.put("source", source)
        cv.put("grade", grade)
        cv.put("tags", tags)
        return writableDatabase.insert("texts", null, cv)
    }

    fun updateText(id: Long, title: String, content: String, grade: String, tags: String) {
        val cv = ContentValues()
        cv.put("title", title)
        cv.put("content", content)
        cv.put("grade", grade)
        cv.put("tags", tags)
        writableDatabase.update("texts", cv, "id=?", arrayOf(id.toString()))
    }

    fun deleteText(id: Long) {
        writableDatabase.delete("texts", "id=?", arrayOf(id.toString()))
        writableDatabase.delete("attempts", "text_id=?", arrayOf(id.toString()))
        writableDatabase.delete("mistakes", "text_id=?", arrayOf(id.toString()))
    }

    fun createAttempt(textId: Long, spokenSentences: String, score: Double, results: String, durationSec: Int): Long {
        val cv = ContentValues()
        cv.put("text_id", textId)
        cv.put("spoken_sentences", spokenSentences)
        cv.put("score", score)
        cv.put("results", results)
        cv.put("duration_sec", durationSec)
        return writableDatabase.insert("attempts", null, cv)
    }

    fun getAttemptHistory(textId: Long): String {
        val cursor = readableDatabase.rawQuery(
            "SELECT * FROM attempts WHERE text_id = ? AND completed = 1 ORDER BY created_at DESC LIMIT 20",
            arrayOf(textId.toString())
        )
        val arr = JSONArray()
        while (cursor.moveToNext()) {
            val obj = JSONObject()
            obj.put("id", cursor.getInt(cursor.getColumnIndexOrThrow("id")))
            obj.put("text_id", cursor.getInt(cursor.getColumnIndexOrThrow("text_id")))
            obj.put("score", cursor.getDouble(cursor.getColumnIndexOrThrow("score")))
            obj.put("results", JSONArray(cursor.getString(cursor.getColumnIndexOrThrow("results"))))
            obj.put("duration_sec", cursor.getInt(cursor.getColumnIndexOrThrow("duration_sec")))
            obj.put("created_at", cursor.getString(cursor.getColumnIndexOrThrow("created_at")))
            arr.put(obj)
        }
        cursor.close()
        return arr.toString()
    }

    fun getMistakeStats(): String {
        val cursor = readableDatabase.rawQuery(
            """SELECT m.*, t.title as text_title, t.content 
               FROM mistakes m JOIN texts t ON m.text_id = t.id 
               ORDER BY m.count DESC LIMIT 50""", null
        )
        val arr = JSONArray()
        while (cursor.moveToNext()) {
            val obj = JSONObject()
            obj.put("id", cursor.getInt(cursor.getColumnIndexOrThrow("id")))
            obj.put("text_id", cursor.getInt(cursor.getColumnIndexOrThrow("text_id")))
            obj.put("sentence_index", cursor.getInt(cursor.getColumnIndexOrThrow("sentence_index")))
            obj.put("word", cursor.getString(cursor.getColumnIndexOrThrow("word")))
            obj.put("count", cursor.getInt(cursor.getColumnIndexOrThrow("count")))
            obj.put("text_title", cursor.getString(cursor.getColumnIndexOrThrow("text_title")))
            arr.put(obj)
        }
        cursor.close()
        return arr.toString()
    }

    fun getMistakeRankings(): String {
        val cursor = readableDatabase.rawQuery(
            """SELECT word, SUM(count) as total, GROUP_CONCAT(DISTINCT t.title) as texts
               FROM mistakes m JOIN texts t ON m.text_id = t.id
               GROUP BY word ORDER BY total DESC LIMIT 30""", null
        )
        val arr = JSONArray()
        while (cursor.moveToNext()) {
            val obj = JSONObject()
            obj.put("word", cursor.getString(cursor.getColumnIndexOrThrow("word")))
            obj.put("total", cursor.getInt(cursor.getColumnIndexOrThrow("total")))
            obj.put("texts", cursor.getString(cursor.getColumnIndexOrThrow("texts")))
            arr.put(obj)
        }
        cursor.close()
        return arr.toString()
    }

    fun addMistake(textId: Long, sentenceIndex: Int, word: String) {
        val cursor = readableDatabase.rawQuery(
            "SELECT id, count FROM mistakes WHERE text_id=? AND sentence_index=? AND word=?",
            arrayOf(textId.toString(), sentenceIndex.toString(), word)
        )
        if (cursor.moveToFirst()) {
            val id = cursor.getLong(0)
            val count = cursor.getInt(1) + 1
            val cv = ContentValues()
            cv.put("count", count)
            writableDatabase.update("mistakes", cv, "id=?", arrayOf(id.toString()))
        } else {
            val cv = ContentValues()
            cv.put("text_id", textId)
            cv.put("sentence_index", sentenceIndex)
            cv.put("word", word)
            writableDatabase.insert("mistakes", null, cv)
        }
        cursor.close()
    }

    fun clearMistakes() {
        writableDatabase.delete("mistakes", null, null)
    }
}
