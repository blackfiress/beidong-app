import { initDb, query, run, insert } from "./server/db.js";

async function seed() {
  await initDb();
  run("INSERT OR IGNORE INTO subjects (name,emoji) VALUES (?,?)", ["语文","🈁"]);
  run("INSERT OR IGNORE INTO subjects (name,emoji) VALUES (?,?)", ["英语","🔤"]);

  const poems = [
    { title: "静夜思", grade: "一上", content: "床前明月光|疑是地上霜|举头望明月|低头思故乡" },
    { title: "咏鹅", grade: "一上", content: "鹅鹅鹅|曲项向天歌|白毛浮绿水|红掌拨清波" },
    { title: "春晓", grade: "一下", content: "春眠不觉晓|处处闻啼鸟|夜来风雨声|花落知多少" },
    { title: "登鹳雀楼", grade: "一下", content: "白日依山尽|黄河入海流|欲穷千里目|更上一层楼" },
    { title: "悯农", grade: "一下", content: "锄禾日当午|汗滴禾下土|谁知盘中餐|粒粒皆辛苦" },
    { title: "望庐山瀑布", grade: "二上", content: "日照香炉生紫烟|遥看瀑布挂前川|飞流直下三千尺|疑是银河落九天" },
    { title: "赠汪伦", grade: "二上", content: "李白乘舟将欲行|忽闻岸上踏歌声|桃花潭水深千尺|不及汪伦送我情" },
    { title: "回乡偶书", grade: "二上", content: "少小离家老大回|乡音无改鬓毛衰|儿童相见不相识|笑问客从何处来" },
    { title: "草", grade: "二下", content: "离离原上草|一岁一枯荣|野火烧不尽|春风吹又生" },
    { title: "咏柳", grade: "二下", content: "碧玉妆成一树高|万条垂下绿丝绦|不知细叶谁裁出|二月春风似剪刀" },
    { title: "早发白帝城", grade: "三上", content: "朝辞白帝彩云间|千里江陵一日还|两岸猿声啼不住|轻舟已过万重山" },
    { title: "望天门山", grade: "三上", content: "天门中断楚江开|碧水东流至此回|两岸青山相对出|孤帆一片日边来" },
    { title: "绝句", grade: "三下", content: "两个黄鹂鸣翠柳|一行白鹭上青天|窗含西岭千秋雪|门泊东吴万里船" },
    { title: "元日", grade: "三下", content: "爆竹声中一岁除|春风送暖入屠苏|千门万户曈曈日|总把新桃换旧符" },
    { title: "题西林壁", grade: "四上", content: "横看成岭侧成峰|远近高低各不同|不识庐山真面目|只缘身在此山中" },
    { title: "暮江吟", grade: "四上", content: "一道残阳铺水中|半江瑟瑟半江红|可怜九月初三夜|露似真珠月似弓" },
    { title: "出塞", grade: "四上", content: "秦时明月汉时关|万里长征人未还|但使龙城飞将在|不教胡马度阴山" },
    { title: "四时田园杂兴", grade: "四下", content: "昼出耘田夜绩麻|村庄儿女各当家|童孙未解供耕织|也傍桑阴学种瓜" },
    { title: "示儿", grade: "五上", content: "死去元知万事空|但悲不见九州同|王师北定中原日|家祭无忘告乃翁" },
    { title: "己亥杂诗", grade: "五上", content: "浩荡离愁白日斜|吟鞭东指即天涯|落红不是无情物|化作春泥更护花" },
    { title: "竹石", grade: "六下", content: "咬定青山不放松|立根原在破岩中|千磨万击还坚劲|任尔东西南北风" },
    { title: "石灰吟", grade: "六下", content: "千锤万凿出深山|烈火焚烧若等闲|粉骨碎身浑不怕|要留清白在人间" },
    { title: "春夜喜雨", grade: "六下", content: "好雨知时节|当春乃发生|随风潜入夜|润物细无声" },
  ];

  let count = 0;
  for (const p of poems) {
    const exist = query("SELECT id FROM texts WHERE title=? AND subject_id=1", [p.title]);
    if (exist.length === 0) {
      insert("INSERT INTO texts (subject_id,title,content,source,grade) VALUES (?,?,?,?,?)",
        [1, p.title, p.content, "builtin", p.grade]);
      count++;
    }
  }
  console.log("Seeded " + count + " poems.");
}

seed().catch(e => console.error("Seed error:", e));
