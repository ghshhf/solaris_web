/* 索拉丽斯炼成计划 · 网页版 —— 剧情数据
   台词全部取自游戏内 localization 表（官方简中），未改写措辞。
   w: 说话人  e: 立绘表情  t: 台词 */
window.STORY = {

  /* ── 开场：造出霍姆 ── */
  opening: [
    { w:'solaris', e:'trouble', t:'怎么样……？\n这次总该没问题了吧……' },
    { w:'solaris', e:'sad', t:'呜呜……果然……\n我不可能做出人造人……' },
    { w:'homu',    e:'normal',   t:'……姆？' },
    { w:'solaris', e:'shock',   t:'!!' },
    { w:'solaris', e:'shy',   t:'……不是在做梦吧？\n摸得到耶……' },
    { w:'solaris', e:'shy',   t:'软绵绵' },
    { w:'homu',    e:'panic', t:'姆姆，请憋这样。' },
    { w:'solaris', e:'shock',     t:'呜、呜哇！\n对不起对不起！' },
    { w:'solaris', e:'normal',   t:'那个……你、你是我——\n索拉丽斯做出来的！' },
    { w:'solaris', e:'smile',   t:'名字……\n既然是人造人，就叫霍姆吧！' },
    { w:'homu',    e:'worry', t:'姆姆！？\n真、真细毫无新意……' },
    { w:'homu',    e:'spirit', t:'但不赖！\n姆今后就叫霍姆！' },
    { w:'solaris', e:'smile',   t:'呼……那太好了！\n这样应该没问题了……\n赶快去参加考试吧！' },
    { w:'homu',    e:'normal',   t:'姆姆？考什末试？' },
    { w:'solaris', e:'normal',   t:'这个嘛……\n讨伐怪物！你能帮我吗……？' },
    { w:'homu',    e:'spirit', t:'姆！那你尽管放心！\n包在霍姆的胸上！' }
  ],

  /* ── 首战之后 ── */
  afterFirst: [
    { w:'homu',    e:'joy',  t:'姆姆！霍姆是赢虾！' },
    { w:'solaris', e:'sparkle',  t:'好耶！\n这样就能通过【考核仪式】了……！' },
    { w:'homu',    e:'worry',  t:'姆姆？考核疑似……？' },
    { w:'solaris', e:'normal',      t:'呃……就是要成为够格的魔法使\n必须接受的考试！' },
    { w:'homu',    e:'normal',      t:'姆姆……都考什么内雍？' },
    { w:'solaris', e:'normal',      t:'什么都考，\n但主要是魔法的实用技巧。' },
    { w:'solaris', e:'sad',    t:'……我身为魔法使，\n却几乎没有魔力。' },
    { w:'solaris', e:'trouble',    t:'至于魔法……\n也是连炼金道具都用不好。' },
    { w:'homu',    e:'worry',  t:'……那岂不细谈不上实用？' },
    { w:'solaris', e:'serious',      t:'嗯，不管多么努力……\n也还是不行。' },
    { w:'solaris', e:'cry',      t:'靠我自己没办法实现梦想，\n也没办法不让妈妈为我操心。' },
    { w:'homu',    e:'spirit', t:'但……看上去真的快没时间了！\n所以……！' },
    { w:'solaris', e:'smile',      t:'……谢谢你愿意帮忙！' },
    { w:'solaris', e:'sparkle',  t:'我一定要突破考核仪式，\n成为一名够格的魔法使！' }
  ],

  /* ── Boss 战前：梅尔希奥托付 ── */
  bossPre: [
    { w:'melchior', e:'normal', t:'索拉丽斯～！\n你在这儿啊！' },
    { w:'solaris',  e:'shock', t:'梅、梅尔希奥大人！\n三贤者怎么会出现在这里？' },
    { w:'solaris',  e:'trouble', t:'这附近都是常人，\n会不会影响您的身体……' },
    { w:'melchior', e:'normal', t:'不用怕，我没那么脆弱。\n比起这个……' },
    { w:'melchior', e:'think', t:'听说你为了重新接受考试，\n正在努力地积累成果？' },
    { w:'melchior', e:'normal', t:'最近好像有人不小心\n把实验用的怪物放进了森林……' },
    { w:'melchior', e:'smile', t:'对于缺少成果、\n没办法重新参加考试的你来说……' },
    { w:'melchior', e:'smile', t:'这一定会对实现目标\n起到很大的帮助！' },
    { w:'solaris',  e:'proud', t:'功劳、算我们的？' },
    { w:'melchior', e:'normal', t:'当然了，成功之后\n我也会亲手给公会写介绍信。' },
    { w:'solaris',  e:'sparkle', t:'……那就不能再磨蹭了！\n必须抓住这个扭转局势的机会！' },
    { w:'solaris',  e:'smile', t:'多谢您了，梅尔希奥大人！\n咱们走吧，霍姆！' },
    { w:'homu',     e:'panic', t:'姆姆！？\n索拉丽斯等等～！' }
  ],

  /* ── Boss 战前：幕后黑手 ── */
  bossPre2: [
    { w:'balthasar', e:'normal',   t:'本来是想把不小心弄丢的实验怪\n抓回来……' },
    { w:'balthasar', e:'grin', t:'结果……\n竟然看到这样的好戏。' },
    { w:'balthasar', e:'normal',   t:'一个人造人——\n还是拥有魔力、会用炼金武器的特制品……' },
    { w:'balthasar', e:'laugh', t:'而且不管怎样，\n终究是战胜了由我制造的史莱姆……' },
    { w:'balthasar', e:'normal',   t:'……这两个家伙不容小觑！' },
    { w:'balthasar', e:'angry', t:'要赶紧铲除这个隐患，\n不能让他们的事情传开！' },
    { w:'balthasar', e:'angry', t:'这都是为了魔法使，\n以及这个世界的秩序……\n抱歉了，这位小姑娘！' },
    { w:'balthasar', e:'laugh', t:'哼哈哈！\n终于又能玩上一场略有挑战性的游戏了！' }
  ],

  /* ── 结局 A：羁绊深厚 ── */
  endBond: [
    { w:'tetia',   e:'smile',  t:'姆！索拉丽斯！特特来了！' },
    { w:'solaris', e:'shock',  t:'呜诶！？特提娅！\n你怎么会……？' },
    { w:'tetia',   e:'smile',  t:'我好歹教过你，当然要来了！\n打得真是漂亮啊！' },
    { w:'solaris', e:'shy',  t:'那都是因为特提娅\n给我的各种帮助啊！' },
    { w:'tetia',   e:'normal',  t:'所以……要去岛外了吗？' },
    { w:'solaris', e:'serious',  t:'嗯，这次决定了。' },
    { w:'solaris', e:'sparkle', t:'我想在岛外帮助更多\n和我一样有困难的人。' },
    { w:'solaris', e:'smile',  t:'——和霍姆一起，\n用我的炼金术！' },
    { w:'homu',    e:'joy', t:'姆！\n霍姆会一直跟在索拉丽斯身边！' }
  ],

  /* ── 结局 B：普通 ── */
  endNormal: [
    { w:'solaris', e:'serious',  t:'索拉丽斯计划………\n克服鲜血诅咒的计划吗……' },
    { w:'solaris', e:'normal',  t:'一开始，我仅仅是为了离开这座岛\n才创造了霍姆。' },
    { w:'solaris', e:'serious',  t:'但是，需要魔法的人们\n一定也都需要霍姆。' },
    { w:'solaris', e:'normal',  t:'由霍姆来使用魔法，\n魔法使的存在就不再有必须性。' },
    { w:'solaris', e:'smile',  t:'只要魔力较弱的魔法使变多，\n鲜血诅咒的浓度一定也会降低。' },
    { w:'solaris', e:'sad', t:'但是……' },
    { w:'solaris', e:'cry',  t:'……霍姆真的愿意\n一直跟在我身边吗？' },
    { w:'homu',    e:'normal',  t:'姆？这是何意？' }
  ],

  /* ── 结局 C：坏结局 ── */
  endBad: [
    { w:'solaris', e:'shock',   t:'不、不！怎么会……\n霍姆……！' },
    { w:'solaris', e:'cry',     t:'对不起……一直都……' },
    { w:'solaris', e:'despair', t:'让你、承担得……\n太多……' },
    { w:'solaris', e:'cry',     t:'啊，谎话，这是谎话吧……' },
    { w:'solaris', e:'despair', t:'我会、我会把你修好……！' },
    { w:'solaris', e:'sad',     t:'啊、啊啊……\n没，没事、没事的……' }
  ]
};

/* ── 交流卡台词池：从"交流結果"里挑的短句，随机取 ── */
window.IDLE_LINES = [
  { w:'homu',    e:'joy',  t:'姆！今天也很有干劲！' },
  { w:'solaris', e:'smile',      t:'看到你这么开心，\n就不枉我辛苦准备一场啦！' },
  { w:'homu',    e:'spirit', t:'包在霍姆的胸上！' },
  { w:'solaris', e:'trouble',    t:'唔……霍姆说话的样子\n简直跟我妈一样嘛……！' },
  { w:'homu',    e:'normal',  t:'嗯！霍姆很高兴有新剑！\n要呼呼地挥动它哦！' },
  { w:'solaris', e:'shy',      t:'唔！竟然比我钓鱼还快……\n……诶，那是用剑抓到的吗？' },
  { w:'homu',    e:'worry',  t:'姆姆……\n都考什么内雍？' },
  { w:'solaris', e:'proud',    t:'呵呵，挥剑练习也很起劲呢！\n很棒哦～霍姆～！' },
  { w:'homu',    e:'normal',      t:'姆。' },
  { w:'solaris', e:'smile',      t:'……谢谢你愿意帮忙！' }
];
